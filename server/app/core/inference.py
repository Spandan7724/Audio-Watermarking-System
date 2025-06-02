import torch
import torch.nn.functional as F

from .network import Generator, Detector
from ..settings import get_settings


# ──────────────────────────────────────────────────────────────────────────────
# configuration
# ──────────────────────────────────────────────────────────────────────────────
settings = get_settings()
device = torch.device(settings.device if torch.cuda.is_available() else "cpu")
SEG_LEN = settings.sample_rate            # 1-second windows (16 000 samples)


# ──────────────────────────────────────────────────────────────────────────────
# weight-file key remapping
#   * prefixes "_orig_mod." come from saving a torch.compile-d model
#   * ".block." → ".net." because ResBlock was renamed
# ──────────────────────────────────────────────────────────────────────────────
def _remap(state_dict: dict[str, torch.Tensor]) -> dict[str, torch.Tensor]:
    out = {}
    for k, v in state_dict.items():
        k = k.removeprefix("_orig_mod.")
        out[k] = v
    return out


# ──────────────────────────────────────────────────────────────────────────────
# load models once, keep on GPU / CPU
# ──────────────────────────────────────────────────────────────────────────────
gen = Generator(settings.message_bits).to(device)
det = Detector(settings.message_bits).to(device)

gen.load_state_dict(
    _remap(torch.load(settings.gen_weights, map_location=device)))
det.load_state_dict(
    _remap(torch.load(settings.det_weights, map_location=device)))

gen.eval()
det.eval()


# ──────────────────────────────────────────────────────────────────────────────
# internal helpers
# ──────────────────────────────────────────────────────────────────────────────
@torch.no_grad()
def _split_into_segments(x: torch.Tensor, seg_len: int = SEG_LEN):
    """
    x shape (B, 1, T) → segments shape (N, B, 1, seg_len),  returns segments, pad
    """
    B, C, T = x.shape
    pad = (seg_len - (T % seg_len)) % seg_len
    if pad:
        x = F.pad(x, (0, pad))
    # unfold: (B, 1, N, seg_len) → permute: (N, B, 1, seg_len)
    segments = (
        x.unfold(dimension=2, size=seg_len, step=seg_len)
        .permute(2, 0, 1, 3)
        .contiguous()
    )
    return segments, pad


@torch.no_grad()
def _concat_and_trim(chunks: list[torch.Tensor], pad: int):
    full = torch.cat(chunks, dim=-1)
    return full[..., :-pad] if pad else full


@torch.no_grad()
def _embed_1sec(seg: torch.Tensor, msg: torch.Tensor):
    delta = gen(seg, msg)
    return seg + delta, delta


# ──────────────────────────────────────────────────────────────────────────────
# public API
# ──────────────────────────────────────────────────────────────────────────────
@torch.no_grad()
def embed_audio(wav: torch.Tensor, message_bits: int):
    """
    wav  : (B, 1, T)
    ↳ returns (watermarked, delta) each shaped like wav
    """
    segments, pad = _split_into_segments(wav)
    wm_chunks, delta_chunks = [], []

    for seg in segments:                                    # iterate 1-s windows
        msg = torch.randint(0, 2 ** message_bits,
                            (seg.size(0),), device=device)
        wm, d = _embed_1sec(seg, msg)
        wm_chunks.append(wm)
        delta_chunks.append(d)

    wm_full = _concat_and_trim(wm_chunks,    pad)
    delta_full = _concat_and_trim(delta_chunks, pad)
    return wm_full, delta_full


@torch.no_grad()
def detect_audio(wav: torch.Tensor, threshold: float):
    """
    wav  : (B, 1, T)
    ↳ returns (probability, is_watermarked)
    """
    segments, pad = _split_into_segments(wav)
    probs = []

    for seg in segments:
        logits = det(seg)
        probs.append(torch.sigmoid(logits[:, :, 0]).mean())

    probability = torch.stack(probs).mean().item()
    return probability, probability >= threshold


# ──────────────────────────────────────────────────────────────────────────────
# metric:  scale-invariant SNR  (training paper’s evaluation)
# ──────────────────────────────────────────────────────────────────────────────
@torch.no_grad()
def compute_si_snr(clean: torch.Tensor, watermarked: torch.Tensor, eps: float = 1e-8):
    """
    clean, watermarked : (B, 1, T)   →  float (dB)
    """
    s = clean - clean.mean(dim=-1, keepdim=True)
    s_hat = watermarked - watermarked.mean(dim=-1, keepdim=True)
    dot = (s * s_hat).sum(dim=-1, keepdim=True)
    s_norm = (s ** 2).sum(dim=-1, keepdim=True)
    s_target = dot / (s_norm + eps) * s
    e_noise = s_hat - s_target
    si_snr = 10 * torch.log10((s_target ** 2).sum(dim=-1) /
                              (e_noise ** 2).sum(dim=-1) + eps)
    return float(si_snr.mean().item())
