@echo off
echo ========================================
echo FarmaDom Backend - Setup e Execucao
echo ========================================
echo.

echo [1/3] Instalando dependencias...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [2/3] Verificando configuracao do banco de dados...
echo.
echo Usando MySQL Remoto:
echo   Host: 192.185.131.80:3306
echo   Database: ononam25_fdom
echo.
echo IMPORTANTE: Certifique-se de que o schema foi importado!
echo Para importar, execute: import-schema-remote.bat
echo.
pause

echo.
echo [3/3] Iniciando servidor backend...
echo.
npm run dev
