@echo off
title Photoframer Studio
cd /d "%~dp0"
echo Starting Photoframer Desktop Application...
npm start
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo An error occurred. Press any key to exit.
  pause
)
