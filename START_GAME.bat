@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Sky Aegis requires Node.js to run the local web server.
  echo Install Node.js 20 or newer, then run START_GAME.bat again.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  echo Missing dist\index.html. This package is incomplete.
  pause
  exit /b 1
)
node scripts\serve.mjs dist 4173 --open
if errorlevel 1 pause
