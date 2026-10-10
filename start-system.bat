@echo off
title VoiceGuard AI - System Launcher
echo ========================================================
echo       VoiceGuard AI: Deepfake Detection System
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/4] Checking Local Database on port 4000...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue)) { $dir = \"$env:LOCALAPPDATA\mysql_voiceclone_data\"; Start-Process -FilePath \"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe\" -ArgumentList \"--no-defaults --port=4000 --datadir=`\"$dir`\"\" -WindowStyle Hidden; Start-Sleep -Seconds 2; Write-Host '  -> Database started on port 4000' } else { Write-Host '  -> Database already listening on port 4000' }"

echo [2/4] Checking AI Microservice on port 8000...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)) { Start-Process -FilePath \"cmd.exe\" -ArgumentList \"/k title AI Microservice (Port 8000) && cd /d `\"%SCRIPT_DIR%ai-service`\" && venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000\" -WindowStyle Normal; Start-Sleep -Seconds 2; Write-Host '  -> AI Microservice started on port 8000' } else { Write-Host '  -> AI Microservice already listening on port 8000' }"

echo [3/4] Checking Spring Boot Backend Gateway on port 8081...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue)) { Start-Process -FilePath \"cmd.exe\" -ArgumentList \"/k title Backend Gateway (Port 8081) && cd /d `\"%SCRIPT_DIR%voice-clone-backend`\" && mvn spring-boot:run `\"-Dspring-boot.run.arguments=--spring.datasource.url=jdbc:mysql://127.0.0.1:4000/voice_clone_detection?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC --spring.datasource.username=root --spring.datasource.password=`\"\" -WindowStyle Normal; Start-Sleep -Seconds 2; Write-Host '  -> Backend Gateway started on port 8081' } else { Write-Host '  -> Backend Gateway already listening on port 8081' }"

echo [4/4] Checking Frontend Client on port 5173...
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)) { Start-Process -FilePath \"cmd.exe\" -ArgumentList \"/k title Frontend Dashboard (Port 5173) && cd /d `\"%SCRIPT_DIR%frontend`\" && npm run dev -- --host 127.0.0.1 --port 5173\" -WindowStyle Normal; Start-Sleep -Seconds 2; Write-Host '  -> Frontend Dashboard started on port 5173' } else { Write-Host '  -> Frontend Dashboard already listening on port 5173' }"

echo.
echo ========================================================
echo  All services verified! Opening browser...
echo  Dashboard: http://localhost:5173
echo ========================================================
start http://localhost:5173

pause
