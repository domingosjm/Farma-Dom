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
echo [2/3] Executando scripts SQL...
echo.
echo Por favor, execute manualmente o arquivo:
echo database\setup_chat_video.sql
echo.
echo No MySQL Workbench ou linha de comando:
echo mysql -u root -p farmadom ^< database\setup_chat_video.sql
echo.
echo Pressione qualquer tecla apos executar o SQL...
pause

echo.
echo [3/3] Iniciando servidor backend...
echo.
npm run dev
