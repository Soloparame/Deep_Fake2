# Fix Model Loading - Use Compatible TensorFlow Version
Write-Host "Fixing Model Loading Issue..." -ForegroundColor Cyan
Write-Host ""
Write-Host "The model was saved with an older TensorFlow version." -ForegroundColor Yellow
Write-Host "We need to use TensorFlow 2.10 which supports 'batch_shape'." -ForegroundColor Yellow
Write-Host ""

# Check if venv is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}

Write-Host "Uninstalling TensorFlow 2.13..." -ForegroundColor Cyan
pip uninstall tensorflow tensorflow-cpu tensorflow-intel -y

Write-Host ""
Write-Host "Installing TensorFlow 2.10 (compatible with your model)..." -ForegroundColor Cyan
Write-Host "This version supports 'batch_shape' and older model formats" -ForegroundColor Gray

pip install tensorflow==2.10.0
pip install numpy==1.23.5
pip install opencv-python==4.8.1.78

Write-Host ""
Write-Host "Testing TensorFlow..." -ForegroundColor Yellow
python -c "import tensorflow as tf; print('TensorFlow version:', tf.__version__)"

Write-Host ""
Write-Host "Testing model loading..." -ForegroundColor Yellow
$modelPath = "fastapi_backend\models\deepfake_model.h5"
if (Test-Path $modelPath) {
    python -c "import tensorflow as tf; model = tf.keras.models.load_model('fastapi_backend/models/deepfake_model.h5', compile=False); print('Model loads successfully!'); print('Input shape:', model.input_shape); print('Output shape:', model.output_shape)"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! Model can now be loaded!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Restart your backend server:" -ForegroundColor White
        Write-Host "   cd fastapi_backend" -ForegroundColor Gray
        Write-Host "   python main.py" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. You should see: 'Model loaded successfully!'" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "Model still won't load. The model file may be corrupted." -ForegroundColor Red
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "   - Model file exists: $modelPath" -ForegroundColor Gray
        Write-Host "   - File size > 0 bytes" -ForegroundColor Gray
        Write-Host "   - File is a valid TensorFlow/Keras .h5 file" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "Model file not found at: $modelPath" -ForegroundColor Yellow
    Write-Host "Please place your deepfake_model.h5 file there first." -ForegroundColor Yellow
}
