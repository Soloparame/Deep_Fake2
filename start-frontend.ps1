# Start Frontend Server Script
Write-Host "🚀 Starting RealEye Frontend Server..." -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
}

# Start development server
Write-Host "✅ Starting Next.js server on http://localhost:3000" -ForegroundColor Green
Write-Host ""
npm run dev


