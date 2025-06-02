from pydantic import BaseModel, Field
from typing import List, Optional


class EmbedResponse(BaseModel):
    download_url: str
    rms:          float = Field(..., description="Watermark RMS amplitude")
    si_snr:       float = Field(..., description="Scale-Invariant SNR (dB)")


class DetectResponse(BaseModel):
    probability:    float
    is_watermarked: bool


# ── new for folder uploads ────────────────────────────────────────────
class DetectItem(BaseModel):
    filename:        str
    probability:     float
    is_watermarked:  bool


class BatchDetectResponse(BaseModel):
    results: List[DetectItem]


class EmbedItem(BaseModel):
    filename:     str
    download_url: str
    rms:          float
    si_snr:       float


class BatchEmbedResponse(BaseModel):
    results:           List[EmbedItem]
    zip_download_url: Optional[str] = Field(
        None, description="URL to download a .zip with all watermarked files")