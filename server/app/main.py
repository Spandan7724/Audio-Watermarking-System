from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import embed, detect
from fastapi.staticfiles import StaticFiles
app = FastAPI(title="Audio Watermarking API")

# CORS for Next.js dev (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
                   "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(embed.router)
app.include_router(detect.router)
app.mount("/static", StaticFiles(directory="static"), name="static")
