@echo off
setlocal
cd /d "%~dp0"

title Conecty - Asistente de Control Remoto Windows

echo ============================================================
echo   CONECTY - ASISTENTE DE CONTROL REMOTO (WINDOWS)
echo ============================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  if exist "agent\conecty-agent.js" (
    echo Iniciando mediante Node.js nativo...
    echo.
    node agent\conecty-agent.js https://conecty.appzplay.online %1
    goto :end
  )
)

if exist "agent\Conecty-Agent.ps1" (
  echo Iniciando mediante PowerShell nativo...
  echo.
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "agent\Conecty-Agent.ps1" -ServerUrl "https://conecty.appzplay.online" -DeviceId "%1"
  goto :end
)

echo [ERROR] No se encontraron los archivos del asistente.
pause

:end
exit /b %ERRORLEVEL%
