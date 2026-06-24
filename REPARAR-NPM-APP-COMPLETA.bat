@echo off
chcp 65001 >nul
title Reparar npm PlanificaIA
cd /d "%~dp0"
echo Esta carpeta portable no necesita npm.
echo.
echo Si quieres reparar la version completa React/Node, ejecuta estos comandos dentro de su carpeta:
echo.
echo npm.cmd cache clean --force
echo rmdir /s /q node_modules
echo del package-lock.json
echo npm.cmd install --no-audit --no-fund
echo npm.cmd run dev
echo.
pause
