# Start Backend Server Script
Write-Host 'Starting RealEye Backend Server...' -ForegroundColor Cyan

$pythonExe = $null
$cmd = Get-Command python -ErrorAction SilentlyContinue
if ($cmd) { 
    $pythonExe = $cmd.Source
    if ($pythonExe -like "*WindowsApps\\python.exe") { $pythonExe = $null }
} else {
    $candidates = @(
        "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
        "C:\Program Files\Python310\python.exe",
        "C:\Program Files\Python311\python.exe"
    )
    foreach ($p in $candidates) { if (Test-Path $p) { $pythonExe = $p; break } }
}
if (-not $pythonExe) {
    Write-Host 'Python not found. Install Python 3.10 and add to PATH.' -ForegroundColor Red
    exit 1
}

# Check if venv exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host 'Virtual environment not found!' -ForegroundColor Red
    Write-Host 'Creating virtual environment...' -ForegroundColor Yellow
    & $pythonExe -m venv venv
}

# Activate virtual environment
Write-Host 'Activating virtual environment...' -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Navigate to backend directory
Set-Location fastapi_backend

# Check if requirements are installed
Write-Host 'Checking dependencies...' -ForegroundColor Yellow
$venvPython = Join-Path $PSScriptRoot "venv\Scripts\python.exe"
$requirementsInstalled = & $venvPython -c "import fastapi, tensorflow, cv2" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Installing dependencies...' -ForegroundColor Yellow
    & $venvPython -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        & $venvPython -m pip install tensorflow-cpu==2.10.0
        & $venvPython -m pip install -r requirements.txt
    }
}

# Check if model file exists
if (-not (Test-Path "models\deepfake_detector (1).keras")) {
    Write-Host 'WARNING: Model file not found at models\deepfake_detector (1).keras' -ForegroundColor Yellow
    Write-Host '   Please place your deepfake_detector (1).keras file in fastapi_backend\models\' -ForegroundColor Yellow
}

# Start server
Write-Host 'Starting FastAPI server on http://localhost:8000' -ForegroundColor Green
Write-Host ""
& $venvPython .\main.py









