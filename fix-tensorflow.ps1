# Fix TensorFlow DLL Error on Windows
Write-Host "🔧 Fixing TensorFlow DLL Error..." -ForegroundColor Cyan
Write-Host ""

# Check if venv is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "📦 Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}

Write-Host "🗑️  Uninstalling old TensorFlow..." -ForegroundColor Yellow
pip uninstall tensorflow tensorflow-cpu -y

Write-Host ""
Write-Host "📥 Installing TensorFlow CPU (more stable on Windows)..." -ForegroundColor Yellow
pip install tensorflow-cpu==2.15.0

Write-Host ""
Write-Host "🧪 Testing TensorFlow import..." -ForegroundColor Yellow
python -c "import tensorflow as tf; print('✅ TensorFlow version:', tf.__version__)"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! TensorFlow is now working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure your model file is at: fastapi_backend\models\deepfake_model.h5" -ForegroundColor White
    Write-Host "2. Restart your backend server:" -ForegroundColor White
    Write-Host "   cd fastapi_backend" -ForegroundColor Gray
    Write-Host "   python main.py" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ TensorFlow still not working." -ForegroundColor Red
    Write-Host ""
    Write-Host "Try these solutions:" -ForegroundColor Yellow
    Write-Host "1. Install Visual C++ Redistributables:" -ForegroundColor White
    Write-Host "   https://aka.ms/vs/17/release/vc_redist.x64.exe" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Try TensorFlow 2.13:" -ForegroundColor White
    Write-Host "   pip install tensorflow==2.13.0" -ForegroundColor Gray
    Write-Host ""
    Write-Host "See fastapi_backend/FIX_TENSORFLOW_DLL_ERROR.md for details" -ForegroundColor Cyan
}









