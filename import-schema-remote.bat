@echo off
REM ============================================
REM Script para importar schema no MySQL remoto
REM FarmaDom - Sistema de Saúde Domiciliar
REM ============================================

echo ============================================
echo FarmaDom - Importar Schema MySQL Remoto
echo ============================================
echo.
echo Host: 192.185.131.80:3306
echo Database: ononam25_fdom
echo User: ononam25_domingos
echo.
echo IMPORTANTE: Certifique-se de ter o MySQL Client instalado
echo.

set /p confirm="Deseja continuar com a importacao do schema? (S/N): "

if /i "%confirm%" NEQ "S" (
    echo Operacao cancelada.
    exit /b
)

echo.
echo Importando schema completo...
echo.

mysql -h 192.185.131.80 -P 3306 -u ononam25_domingos -p ononam25_fdom < database\mysql_schema_complete.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Schema importado com sucesso!
    echo ============================================
) else (
    echo.
    echo ============================================
    echo Erro ao importar schema!
    echo Verifique:
    echo - Conexao com o servidor
    echo - Credenciais de acesso
    echo - MySQL client instalado
    echo ============================================
)

echo.
pause
