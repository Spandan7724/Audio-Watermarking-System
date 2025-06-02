from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    gen_weights: str = Field(
        "server/weights/generator_best.pth", env="GEN_WEIGHTS")
    det_weights: str = Field("server/weights/detector_best.pth",  env="DET_WEIGHTS")
    device:      str = Field("cuda", env="DEVICE")  # "cuda" or "cpu"
    sample_rate: int = 16_000
    message_bits: int = 16
    threshold:   float = 0.5

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
