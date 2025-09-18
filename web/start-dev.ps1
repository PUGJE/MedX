Write-Host "Starting development servers..." -ForegroundColor Green

# Start API server in background
Write-Host "Starting API server on port 8787..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "server/index.mjs" -WindowStyle Minimized

# Wait a moment for API server to start
Start-Sleep -Seconds 2

# Start Vite server
Write-Host "Starting Vite server on port 5173..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev:web-only" -WindowStyle Normal

Write-Host "Both servers should be starting..." -ForegroundColor Green
Write-Host "API Server: http://localhost:8787" -ForegroundColor Cyan
Write-Host "Vite Server: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press any key to stop all servers..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
