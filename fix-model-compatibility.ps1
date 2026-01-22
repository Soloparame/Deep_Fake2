# Fix Model Compatibility Issues
Write-Host "🔧 Fixing Model Compatibility..." -ForegroundColor Cyan
Write-Host ""

# Check if venv is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "📦 Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}

Write-Host "📋 Issues detected:" -ForegroundColor Yellow
Write-Host "  1. Model was saved with older TensorFlow (uses 'batch_shape')" -ForegroundColor White
Write-Host "  2. NumPy version conflict between TensorFlow and OpenCV" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Fixing..." -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Uninstalling incompatible packages..." -ForegroundColor Cyan
pip uninstall tensorflow tensorflow-cpu tensorflow-intel opencv-python opencv-python-headless -y

Write-Host ""
Write-Host "2. Installing compatible versions..." -ForegroundColor Cyan
Write-Host "   - TensorFlow 2.13 (compatible with older models)" -ForegroundColor Gray
Write-Host "   - NumPy 1.24.3 (compatible with both TF and OpenCV)" -ForegroundColor Gray
Write-Host "   - OpenCV 4.8.1.78 (compatible with NumPy 1.x)" -ForegroundColor Gray

pip install tensorflow==2.13.0
pip install numpy==1.24.3
pip install opencv-python==4.8.1.78

Write-Host ""
Write-Host "🧪 Testing..." -ForegroundColor Yellow
python -c "import tensorflow as tf; import cv2; import numpy as np; print('✅ TensorFlow:', tf.__version__); print('✅ OpenCV:', cv2.__version__); print('✅ NumPy:', np.__version__)"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! All packages are now compatible!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your backend server:" -ForegroundColor White
    Write-Host "   cd fastapi_backend" -ForegroundColor Gray
    Write-Host "   python main.py" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. The model should now load successfully!" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Installation failed. Check errors above." -ForegroundColor Red
}



