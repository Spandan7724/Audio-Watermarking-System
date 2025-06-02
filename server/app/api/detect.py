from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List
import tempfile
import os
import torchaudio

from ..core.inference import detect_audio, device
from ..models import DetectResponse, DetectItem, BatchDetectResponse
from ..settings import get_settings

torchaudio.set_audio_backend("soundfile")

router = APIRouter(prefix="/detect", tags=["detect"])
settings = get_settings()


@router.post("", response_model=DetectResponse)
async def detect(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio"):
        raise HTTPException(400, "Only audio files supported")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=file.filename).name
    try:
        with open(tmp, "wb") as f:
            f.write(await file.read())

        wav, sr = torchaudio.load(tmp)
        if sr != settings.sample_rate:
            wav = torchaudio.transforms.Resample(sr, settings.sample_rate)(wav)
        if wav.shape[0] > 1:
            wav = wav.mean(0, keepdim=True)
        wav = wav.to(device)

        prob, is_wm = detect_audio(wav.unsqueeze(0), settings.threshold)
        return DetectResponse(probability=prob, is_watermarked=is_wm)
    finally:
        os.remove(tmp)


@router.post("/folder", response_model=BatchDetectResponse)
async def detect_folder(
    files: List[UploadFile] = File(...),
    threshold: float = Form(settings.threshold),
):
    """
    Accepts multiple audio files (folder upload via <input multiple webkitdirectory>),
    runs detection on each, and returns a list of results.
    Non-audio or unreadable files are silently skipped.
    """
    results: List[DetectItem] = []

    with tempfile.TemporaryDirectory() as tmpdir:
        for upload in files:
            if not upload.content_type.startswith("audio"):
                continue

            dst = os.path.join(tmpdir, upload.filename)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(dst, "wb") as f:
                f.write(await upload.read())

            # robust load
            try:
                wav, sr = torchaudio.load(dst)
            except Exception:
                continue

            if sr != settings.sample_rate:
                wav = torchaudio.transforms.Resample(
                    sr, settings.sample_rate)(wav)
            if wav.shape[0] > 1:
                wav = wav.mean(0, keepdim=True)
            wav = wav.to(device)

            prob, is_wm = detect_audio(wav.unsqueeze(0), threshold)
            results.append(
                DetectItem(
                    filename=upload.filename,
                    probability=prob,
                    is_watermarked=is_wm,
                )
            )

    return BatchDetectResponse(results=results)
