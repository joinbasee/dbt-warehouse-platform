# 智能数据平台 v1.0 — dbt Agent Platform Launcher
$platformDir = Join-Path $PSScriptRoot "..\platform"

# Kill existing processes
taskkill /f /im electron.exe 2>$null | Out-Null
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  智能数据平台  v1.0" -ForegroundColor White
Write-Host "  Multi-Agent dbt Data Warehouse Platform" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Start Vite
Write-Host ">>> 启动 Vite 开发服务器..." -ForegroundColor Yellow
$vitePath = Join-Path $platformDir "node_modules\.bin\vite.cmd"
$viteProc = Start-Process -FilePath $vitePath `
    -ArgumentList "--port","5174","--strictPort" `
    -WorkingDirectory $platformDir `
    -WindowStyle Minimized `
    -PassThru

# Wait for Vite
Write-Host ">>> 等待 Vite 就绪..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5174" -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
        $ready = $true
        Write-Host "[OK] Vite 就绪 ($($i+1)s) http://localhost:5174" -ForegroundColor Green
        break
    } catch { }
}
if (-not $ready) {
    Write-Host "[FAIL] Vite 启动超时" -ForegroundColor Red
    if ($viteProc -and !$viteProc.HasExited) { Stop-Process -Id $viteProc.Id -Force }
    Read-Host "按 Enter 退出"
    exit 1
}

# Launch Electron
Write-Host ">>> 启动 Electron 桌面窗口..." -ForegroundColor Yellow
$electronPath = Join-Path $platformDir "node_modules\.bin\electron.cmd"
$electronProc = Start-Process -FilePath $electronPath `
    -ArgumentList "." `
    -WorkingDirectory $platformDir `
    -Wait `
    -PassThru

# Cleanup
if ($viteProc -and !$viteProc.HasExited) {
    Stop-Process -Id $viteProc.Id -Force -ErrorAction SilentlyContinue
}
Write-Host ""
Write-Host "  应用已关闭。" -ForegroundColor Gray