# Fix All Dependency Issues
Write-Host "🔧 Fixing All Dependency Issues..." -ForegroundColor Cyan
Write-Host ""

# Check which venv to use
if (Test-Path ".venv-backend") {
    Write-Host "⚠️  Found .venv-backend - but you should use 'venv' instead" -ForegroundColor Yellow
    Write-Host "   Using main 'venv' directory..." -ForegroundColor Yellow
}

if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "📦 Activating virtual environment (venv)..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host ""
Write-Host "🔍 Issues detected:" -ForegroundColor Yellow
Write-Host "  1. Pydantic version conflict (FastAPI needs v2.x)" -ForegroundColor White
Write-Host "  2. Need to ensure TensorFlow 2.13 is installed" -ForegroundColor White
Write-Host "  3. NumPy/OpenCV compatibility" -ForegroundColor White
Write-Host ""

Write-Host "🗑️  Uninstalling conflicting packages..." -ForegroundColor Cyan
pip uninstall pydantic pydantic-core fastapi -y

Write-Host ""
Write-Host "📥 Installing compatible versions..." -ForegroundColor Cyan
Write-Host "   - Pydantic 2.5.0 (required by FastAPI 0.104.1)" -ForegroundColor Gray
Write-Host "   - FastAPI 0.104.1" -ForegroundColor Gray
Write-Host "   - TensorFlow 2.13.0 (compatible with your model)" -ForegroundColor Gray
Write-Host "   - NumPy 1.24.3 (compatible with TF and OpenCV)" -ForegroundColor Gray
Write-Host "   - OpenCV 4.8.1.78" -ForegroundColor Gray

# Install in correct order
pip install pydantic==2.5.0
pip install fastapi==0.104.1
pip install uvicorn[standard]==0.24.0
pip install python-multipart==0.0.6

# ML packages
pip install tensorflow==2.13.0
pip install numpy==1.24.3
pip install opencv-python==4.8.1.78

# Other dependencies
pip install python-dotenv==1.0.0

Write-Host ""
Write-Host "🧪 Testing imports..." -ForegroundColor Yellow
python -c "from fastapi import FastAPI; from pydantic import TypeAdapter; import tensorflow as tf; import cv2; print('✅ FastAPI: OK'); print('✅ Pydantic: OK'); print('✅ TensorFlow:', tf.__version__); print('✅ OpenCV:', cv2.__version__)"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! All dependencies are now compatible!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure your model file is at: fastapi_backend\models\deepfake_model.h5" -ForegroundColor White
    Write-Host "2. Start backend with:" -ForegroundColor White
    Write-Host "   cd fastapi_backend" -ForegroundColor Gray
    Write-Host "   python main.py" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   OR use:" -ForegroundColor White
    Write-Host "   .\venv\Scripts\python -m fastapi_backend.main" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Some imports failed. Check errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Try installing from requirements.txt:" -ForegroundColor Yellow
    Write-Host "   pip install -r fastapi_backend\requirements.txt" -ForegroundColor Gray
}






