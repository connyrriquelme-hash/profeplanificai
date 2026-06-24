@echo off
chcp 65001 >nul
title PlanificaIA Chile Portable
echo Abriendo PlanificaIA Chile Portable...
start "" "%~dp0index.html"
echo.
echo Si no se abre automaticamente, abre este archivo:
echo %~dp0index.html
echo.
pause
