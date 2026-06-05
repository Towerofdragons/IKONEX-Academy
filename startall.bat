@echo off
rem Run startall.ps1 bypassing PowerShell execution restrictions
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0startall.ps1"
