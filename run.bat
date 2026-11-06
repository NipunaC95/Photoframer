@echo off
title Photoframer Studio
cd /d "%~dp0"
echo ========================================================
echo   Launching Photoframer Desktop Studio...
echo ========================================================
echo.
call npm.cmd start
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Application failed to launch.
  pause
)
