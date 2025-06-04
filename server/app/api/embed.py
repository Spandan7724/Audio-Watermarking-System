from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException,
    BackgroundTasks,
)
from fastapi.responses import FileResponse
from typing import List
import tempfile
import os
import uuid
import shutil
import mimetypes
import time

import torchaudio
import torch

from ..core.inference import embed_audio, compute_si_snr, device
from ..models import EmbedResponse, EmbedItem, BatchEmbedResponse
from ..settings import get_settings

torchaudio.set_audio_backend("soundfile")

router = APIRouter(prefix="/embed", tags=["embed"])
settings = get_settings()

# ──────────────────────────────────────────────────────────────────────
# single-file embed
# ──────────────────────────────────────────────────────────────────────


@router.post("", response_model=EmbedResponse)
async def embed(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio"):
        raise HTTPException(400, "Only audio files supported")

    tmp_in = tempfile.NamedTemporaryFile(delete=False,
                                         suffix=os.path.splitext(file.filename)[1]).name
    tmp_out = tempfile.NamedTemporaryFile(delete=False,
                                          suffix="_wm.wav").name
    try:
        with open(tmp_in, "wb") as f:
            f.write(await file.read())

        wav, sr = torchaudio.load(tmp_in)
        if sr != settings.sample_rate:
            wav = torchaudio.transforms.Resample(sr, settings.sample_rate)(wav)
        if wav.shape[0] > 1:
            wav = wav.mean(0, keepdim=True)
        wav = wav.to(device)

        wm, delta = embed_audio(wav.unsqueeze(0), settings.message_bits)
        torchaudio.save(
            tmp_out,
            wm.squeeze(0).cpu(),
            settings.sample_rate,
            bits_per_sample=16,  # match folder embed output
        )

        rms = float(torch.sqrt((delta**2).mean()).item())
        si = compute_si_snr(wav.unsqueeze(0), wm)

        url = f"/embed/download/{os.path.basename(tmp_out)}"
        return EmbedResponse(download_url=url, rms=rms, si_snr=si)
    finally:
        os.remove(tmp_in)


# ──────────────────────────────────────────────────────────────────────
# generic download helper (serves wav / mp3 / flac / zip … )
# ──────────────────────────────────────────────────────────────────────
# ───────────── server/api/embed.py  ─────────────
@router.get("/download/{fname}")
def download(fname: str):
    tmp_root = tempfile.gettempdir()

    # 1️⃣ first try the root (keeps zip downloads fast)
    path = os.path.join(tmp_root, fname)
    if not os.path.exists(path):
        # 2️⃣ scan one level of sub-folders created by embed_folder
        for sub in os.listdir(tmp_root):
            candidate = os.path.join(tmp_root, sub, fname)
            if os.path.exists(candidate):
                path = candidate
                break
        else:                                          # nothing found
            raise HTTPException(404, "File not found")

    media_type = mimetypes.guess_type(fname)[0] or "application/octet-stream"
    return FileResponse(path, media_type=media_type, filename=fname)


# ──────────────────────────────────────────────────────────────────────
# folder embed  ➜  per-file list   +   zip   +   delayed cleanup
# ──────────────────────────────────────────────────────────────────────
@router.post("/folder", response_model=BatchEmbedResponse)
async def embed_folder(
    background_tasks: BackgroundTasks,              # ← NEW
    files: List[UploadFile] = File(...),
    message_bits: int = Form(settings.message_bits),
):
    """
    Embed a watermark in every valid audio file.
    • Returns JSON with per-file metrics **and** a .zip link.
    • Keeps the individual files for 10 minutes, then deletes them
      in a background task so download links remain valid.
    """
    results: List[EmbedItem] = []

    # 1️⃣ make a temp directory that survives past the response
    out_dir = tempfile.mkdtemp(dir=tempfile.gettempdir())

    for upload in files:
        if not upload.content_type.startswith("audio"):
            continue

        # save original upload to a temp file
        with tempfile.NamedTemporaryFile(delete=False,
                                         suffix=os.path.splitext(upload.filename)[1]) as fp:
            fp.write(await upload.read())
            in_path = fp.name

        # load & preprocess
        try:
            wav, sr = torchaudio.load(in_path)
        except Exception:
            os.remove(in_path)
            continue

        if sr != settings.sample_rate:
            wav = torchaudio.transforms.Resample(sr, settings.sample_rate)(wav)
        if wav.shape[0] > 1:
            wav = wav.mean(0, keepdim=True)
        wav = wav.to(device)

        # embed
        wm, delta = embed_audio(wav.unsqueeze(0), message_bits)

        # save output into out_dir
        out_fname = f"{uuid.uuid4().hex}_{os.path.splitext(upload.filename)[0]}_wm.wav"
        out_path = os.path.join(out_dir, out_fname)
        torchaudio.save(
            out_path,
            wm.squeeze(0).cpu(),
            settings.sample_rate,
            bits_per_sample=16     # 16-bit WAV
        )

        # metrics
        rms = float(torch.sqrt((delta**2).mean()).item())
        si = compute_si_snr(wav.unsqueeze(0), wm)

        results.append(
            EmbedItem(
                filename=upload.filename,
                download_url=f"/embed/download/{out_fname}",
                rms=rms,
                si_snr=si,
            )
        )

        os.remove(in_path)   # remove original temp

    # 2️⃣ zip everything
    zip_base = f"{uuid.uuid4().hex}_watermarked"
    zip_path = shutil.make_archive(
        base_name=os.path.join(tempfile.gettempdir(), zip_base),
        format="zip",
        root_dir=out_dir,
    )
    zip_url = f"/embed/download/{os.path.basename(zip_path)}"

    # 3️⃣ schedule deletion of out_dir ten minutes from now
    def delayed_delete(path: str, seconds: int = 600):
        """Delete files or directories after a delay."""
        time.sleep(seconds)
        if os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
        elif os.path.exists(path):
            os.remove(path)

    background_tasks.add_task(delayed_delete, out_dir, 600)
    background_tasks.add_task(delayed_delete, zip_path, 600)

    return BatchEmbedResponse(results=results, zip_download_url=zip_url)
