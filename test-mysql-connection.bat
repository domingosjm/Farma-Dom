@echo off
REM ============================================
REM Script para diagnosticar conexao MySQL Remoto
REM FarmaDom - Sistema de Saude Domiciliar
REM ============================================

echo ============================================
echo FarmaDom - Diagnostico MySQL Remoto
echo ============================================
echo.

echo [1/5] Verificando seu IP publico...
echo.
powershell -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing).Content"
echo.

echo [2/5] Testando ping para o servidor MySQL...
echo.
ping -n 4 192.185.131.80
echo.

echo [3/5] Testando se a porta 3306 esta acessivel...
echo.
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('192.185.131.80', 3306); Write-Host 'Porta 3306: ABERTA' -ForegroundColor Green; $client.Close() } catch { Write-Host 'Porta 3306: FECHADA ou BLOQUEADA' -ForegroundColor Red }"
echo.

echo [4/5] Verificando configuracao do backend...
echo.
if exist "backend\.env" (
    echo Arquivo .env encontrado:
    echo   MYSQL_HOST=192.185.131.80
    echo   MYSQL_PORT=3306
    echo   MYSQL_USER=ononam25_domingos
    echo   MYSQL_DATABASE=ononam25_fdom
    echo.
) else (
    echo ERRO: Arquivo backend\.env nao encontrado!
    echo.
)

echo [5/5] Testando conexao MySQL (se mysql client estiver instalado)...
echo.
where mysql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Tentando conectar ao MySQL...
    echo Digite a senha quando solicitado.
    echo.
    mysql -h 192.185.131.80 -P 3306 -u ononam25_domingos -p -e "SELECT 'Conexao bem-sucedida!' as status;"
) else (
    echo MySQL client nao esta instalado no PATH
    echo Baixe em: https://dev.mysql.com/downloads/mysql/
)

echo.
echo ============================================
echo Diagnostico Completo
echo ============================================
echo.
echo Se a porta 3306 estiver FECHADA ou BLOQUEADA:
echo   - Seu IP precisa ser liberado no servidor
echo   - Acesse o cPanel ^> Remote MySQL
echo   - Adicione seu IP a lista permitida
echo.
echo Para mais informacoes, veja:
echo   MYSQL-ACCESS-ERROR-FIX.md
echo.
pause
