# RealEye FastAPI Backend

Deepfake detection backend with TensorFlow/Keras ML model integration.

## 🚀 Quick Start

### 1. Place Your Model File

Place your trained `deepfake_model.h5` file here:
```
fastapi_backend/models/deepfake_model.h5
```

### 2. Install Dependencies

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

# Install dependencies
cd fastapi_backend
pip install -r requirements.txt
```

### 3. Run the Server

```bash
python main.py
```

Server will start at: `http://localhost:4000`

### 4. Test the Endpoint

```bash
curl -X POST "http://localhost:4000/api/detect-video" \
  -F "file=@your_video.mp4"
```

## 📁 Project Structure

```
fastapi_backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Dependencies
├── routers/
│   ├── detect.py          # Video detection endpoint
│   ├── auth.py            # Authentication
│   └── chat.py            # Chat endpoints
├── services/
│   └── model_service.py   # ML model logic
├── core/
│   └── config.py          # Configuration
└── models/
    └── deepfake_model.h5  # Your model file (place here)
```

## 🔌 API Endpoints

### POST `/api/detect-video`

Upload a video file for deepfake detection.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: video file (key: `file`)

**Response:**
```json
{
  "result": "REAL" | "FAKE",
  "confidence": 0.95
}
```

**Example:**
```bash
curl -X POST "http://localhost:4000/api/detect-video" \
  -F "file=@video.mp4"
```

## 📚 Documentation

For detailed architecture and implementation guide, see:
- **[ML_INTEGRATION_GUIDE.md](./ML_INTEGRATION_GUIDE.md)** - Complete integration guide

## 🛠️ Configuration

Edit `core/config.py` to adjust:
- Model path
- Maximum frames to process
- Input image size

## 📦 Dependencies

- FastAPI - Web framework
- TensorFlow - ML framework
- OpenCV - Video processing
- Uvicorn - ASGI server

See `requirements.txt` for full list.

## 🐛 Troubleshooting

See [ML_INTEGRATION_GUIDE.md](./ML_INTEGRATION_GUIDE.md#part-9---common-errors--fixes) for common errors and solutions.

## 📝 Notes

- Model loads **once** at startup (not per request)
- Videos are processed frame-by-frame with sampling
- Temporary files are automatically cleaned up
- Supports common video formats (mp4, avi, mov, webm)





