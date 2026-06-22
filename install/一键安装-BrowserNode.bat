@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-browsernode.ps1"
pause
