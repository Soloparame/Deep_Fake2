# Start Backend Server Script
Write-Host "🚀 Starting RealEye Backend Server..." -ForegroundColor Cyan

# Check if venv exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "📦 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Navigate to backend directory
Set-Location fastapi_backend

# Check if requirements are installed
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow
$requirementsInstalled = python -c "import fastapi, tensorflow, cv2" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Check if model file exists
if (-not (Test-Path "models\deepfake_model.h5")) {
    Write-Host "⚠️  WARNING: Model file not found at models\deepfake_model.h5" -ForegroundColor Yellow
    Write-Host "   Please place your deepfake_model.h5 file in fastapi_backend\models\" -ForegroundColor Yellow
}

# Start server
Write-Host "✅ Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Write-Host ""
python main.py









