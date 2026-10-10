# VoiceGuard AI - PowerShell System Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      VoiceGuard AI: Deepfake Detection System" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot

# 1. Database Check (Port 4000)
Write-Host "[1/4] Checking Local Database on port 4000..." -ForegroundColor Yellow
$dbPort = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
if (-not $dbPort) {
    $dbDir = "$env:LOCALAPPDATA\mysql_voiceclone_data"
    Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" -ArgumentList "--no-defaults --port=4000 --datadir=`"$dbDir`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "  -> Database started on port 4000" -ForegroundColor Green
} else {
    Write-Host "  -> Database already listening on port 4000" -ForegroundColor Green
}

# 2. AI Microservice (Port 8000)
Write-Host "[2/4] Checking AI Microservice on port 8000..." -ForegroundColor Yellow
$aiPort = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $aiPort) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k title AI Microservice (Port 8000) && cd /d `"$rootDir\ai-service`" && venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000" -WindowStyle Normal
    Start-Sleep -Seconds 2
    Write-Host "  -> AI Microservice started on port 8000" -ForegroundColor Green
} else {
    Write-Host "  -> AI Microservice already listening on port 8000" -ForegroundColor Green
}

# 3. Backend Gateway (Port 8081)
Write-Host "[3/4] Checking Backend Gateway on port 8081..." -ForegroundColor Yellow
$backendPort = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if (-not $backendPort) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Backend Gateway (Port 8081) && cd /d `"$rootDir\voice-clone-backend`" && mvn spring-boot:run `"-Dspring-boot.run.arguments=--spring.datasource.url=jdbc:mysql://127.0.0.1:4000/voice_clone_detection?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC --spring.datasource.username=root --spring.datasource.password=`"" -WindowStyle Normal
    Start-Sleep -Seconds 2
    Write-Host "  -> Backend Gateway started on port 8081" -ForegroundColor Green
} else {
    Write-Host "  -> Backend Gateway already listening on port 8081" -ForegroundColor Green
}

# 4. Frontend Client (Port 5173)
Write-Host "[4/4] Checking Frontend Client on port 5173..." -ForegroundColor Yellow
$fePort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $fePort) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Frontend Dashboard (Port 5173) && cd /d `"$rootDir\frontend`" && npm run dev -- --host 127.0.0.1 --port 5173" -WindowStyle Normal
    Start-Sleep -Seconds 2
    Write-Host "  -> Frontend Dashboard started on port 5173" -ForegroundColor Green
} else {
    Write-Host "  -> Frontend Dashboard already listening on port 5173" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " All services running! Opening http://localhost:5173" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Start-Process "http://localhost:5173"
