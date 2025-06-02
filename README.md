#  Audio Watermarking System

A full-stack web application for embedding and detecting watermarks in audio files using deep learning. This project provides both REST API endpoints and a modern web interface for audio watermarking operations.

##  Features

### Core Functionality
- **Audio Watermark Embedding**: Imperceptibly embed digital watermarks into audio files
- **Watermark Detection**: Detect and verify watermarks in audio files with confidence scores
- **Batch Processing**: Process multiple audio files simultaneously
- **Quality Metrics**: Compute Signal-to-Interference-plus-Noise Ratio (SI-SNR) and RMS metrics
- **Multiple Format Support**: Support for various audio formats (WAV, MP3, FLAC, etc.)

### Web Interface
- Modern, responsive Next.js frontend
- Drag-and-drop file upload
- Real-time processing feedback
- Batch operations with progress tracking
- Download processed files individually or as ZIP archives

### API Features
- RESTful API with FastAPI
- Automatic OpenAPI documentation
- File upload endpoints
- Configurable watermark parameters
- Background task processing

## Architecture

```
audio_watermarking_pbl2/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   └── components/      # React components
│   └── package.json
├── server/                   # FastAPI backend
│   ├── app/
│   │   ├── api/             # API endpoints
│   │   │   ├── embed.py     # Watermark embedding
│   │   │   └── detect.py    # Watermark detection
│   │   ├── core/            # Core ML logic
│   │   │   ├── inference.py # Model inference
│   │   │   └── network.py   # Neural network models
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Pydantic data models
│   │   └── settings.py      # Configuration
│   └── weights/             # Pre-trained model weights
├── static/                   # Static file storage
└── pyproject.toml           # Python dependencies
```

##  Technology Stack

### Backend
- **FastAPI**: High-performance web framework
- **PyTorch**: Deep learning framework
- **TorchAudio**: Audio processing library
- **Librosa**: Audio analysis library
- **Pydantic**: Data validation and settings
- **Uvicorn**: ASGI server

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

### Machine Learning
- **Custom Neural Networks**: Generator and detector models
- **Audio Processing**: 16kHz sampling, mono conversion
- **Configurable Parameters**: Message bits, threshold tuning

##  Prerequisites

- **Python**: 3.12 or higher
- **Node.js**: 18 or higher
- **UV**: Python package manager (recommended)
- **CUDA**: Optional, for GPU acceleration

## 🚀Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Spandan7724/Audio-Watermarking-System
cd Audio-Watermarking-System
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
# or if using uv 
uv venv

# Windows
.\.venv\Scripts\Activate

.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
# or if using uv
uv sync
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Model Weights
Place your pre-trained model weights in the `server/weights/` directory:
- `generator_best.pth`: Watermark embedding model
- `detector_best.pth`: Watermark detection model

##  Running the Application

### Start Backend Server
```bash
# From project root
uvicorn server.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend Development Server
```bash
# In a new terminal
cd frontend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## API Documentation

### Embed Watermark

#### Single File
```http
POST /embed
Content-Type: multipart/form-data

file: audio_file.wav
```

**Response:**
```json
{
  "download_url": "/embed/download/watermarked_file.wav",
  "rms": 0.0123,
  "si_snr": 25.5
}
```

#### Batch Processing
```http
POST /embed/folder
Content-Type: multipart/form-data

files[]: audio1.wav
files[]: audio2.wav
message_bits: 16
```

**Response:**
```json
{
  "results": [
    {
      "filename": "audio1.wav",
      "download_url": "/embed/download/uuid_audio1_wm.wav",
      "rms": 0.0123,
      "si_snr": 25.5
    }
  ],
  "zip_download_url": "/embed/download/batch_watermarked.zip"
}
```

### Detect Watermark

#### Single File
```http
POST /detect
Content-Type: multipart/form-data

file: audio_file.wav
```

**Response:**
```json
{
  "probability": 0.95,
  "is_watermarked": true
}
```

#### Batch Detection
```http
POST /detect/folder
Content-Type: multipart/form-data

files[]: audio1.wav
files[]: audio2.wav
threshold: 0.5
```

**Response:**
```json
{
  "results": [
    {
      "filename": "audio1.wav",
      "probability": 0.95,
      "is_watermarked": true
    }
  ]
}
```

##  Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
# Model paths
GEN_WEIGHTS=server/weights/generator_best.pth
DET_WEIGHTS=server/weights/detector_best.pth

# Device configuration
DEVICE=cuda  # or cpu

# Audio processing settings
SAMPLE_RATE=16000
MESSAGE_BITS=16
THRESHOLD=0.5
```

### Settings
- **Sample Rate**: 16kHz (configurable)
- **Message Bits**: 16-bit watermark message
- **Detection Threshold**: 0.5 confidence threshold
- **Device**: CUDA/CPU selection

##  Usage Examples

### Python API Client
```python
import requests

# Embed watermark
with open('audio.wav', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/embed',
        files={'file': f}
    )
    result = response.json()
    print(f"SI-SNR: {result['si_snr']}")

# Detect watermark
with open('watermarked.wav', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/detect',
        files={'file': f}
    )
    result = response.json()
    print(f"Watermarked: {result['is_watermarked']}")
```

### cURL Examples
```bash
# Embed watermark
curl -X POST "http://localhost:8000/embed" \
     -F "file=@audio.wav"

# Detect watermark
curl -X POST "http://localhost:8000/detect" \
     -F "file=@watermarked.wav"
```

##  Development

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend Development
```bash
# Run with auto-reload
uvicorn server.app.main:app --reload

# Run tests (if available)
pytest

# Type checking
ty check server
```

##  Project Structure Details

### Backend Modules
- **`main.py`**: FastAPI application setup and CORS configuration
- **`api/embed.py`**: Watermark embedding endpoints
- **`api/detect.py`**: Watermark detection endpoints
- **`core/inference.py`**: Model loading and inference logic
- **`core/network.py`**: Neural network architecture definitions
- **`models.py`**: Pydantic models for request/response validation
- **`settings.py`**: Configuration management

### Frontend Structure
- **`src/app/`**: Next.js App Router pages
- **`src/components/`**: Reusable React components
- **`src/lib/`**: Utility functions and configurations



##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- Built with FastAPI and Next.js
- Audio processing powered by PyTorch and Librosa


---

**Note**: Ensure you have the required model weights (`generator_best.pth` and `detector_best.pth`) in the `server/weights/` directory before running the application. 