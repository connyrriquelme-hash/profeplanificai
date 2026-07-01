@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==========================================
echo  PlanificaIA Chile - entorno local completo
echo ==========================================
echo.

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 goto error
)

echo Aplicando migraciones D1 locales...
call npm run local:setup
if errorlevel 1 goto error

echo.
echo Iniciando app local en http://localhost:8788
echo Si Windows Firewall pregunta, permite acceso local.
echo.
call npm run local:dev
goto end

:error
echo.
echo Ocurrio un error preparando el entorno local.
echo Revisa el mensaje anterior y vuelve a intentar.
pause

:end
endlocal
