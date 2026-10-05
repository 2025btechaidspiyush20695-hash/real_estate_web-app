@echo off
REM ============================================================
REM  Gurukripa Estate - start bundled MongoDB (no installation!)
REM  Uses the mongod.exe shipped inside this project's
REM  .runtime\mongodb-win folder. Data is stored in
REM  .runtime\mongodb-data (persists between runs).
REM
REM  NOTE: goto-based flow (no parenthesized blocks) so this
REM  script works even when the project folder name contains
REM  special characters like (1).
REM ============================================================
setlocal
cd /d "%~dp0\.."
set "ROOT=%CD%"
set "MONGOD=%ROOT%\.runtime\mongodb-win\bin\mongod.exe"
set "DBPATH=%ROOT%\.runtime\mongodb-data"
if not exist "%DBPATH%" mkdir "%DBPATH%"

REM Already running? (user may have their own MongoDB service)
netstat -an | findstr ":27017" | findstr "LISTENING" >nul 2>nul
if errorlevel 1 goto :checkmongod
echo [ok] MongoDB already running on port 27017.
exit /b 0

:checkmongod
if exist "%MONGOD%" goto :startit
echo [!] Bundled MongoDB not found.
echo     Expected at: %MONGOD%
echo     Make sure you extracted the FULL project from the zip.
exit /b 1

:startit
echo [..] Starting bundled MongoDB - data goes to .runtime\mongodb-data
start "Gurukripa MongoDB" /min "%MONGOD%" --dbpath "%DBPATH%" --port 27017 --bind_ip 127.0.0.1

REM wait until port 27017 is listening (max ~30 seconds)
set /a tries=0
:waitloop
set /a tries+=1
netstat -an | findstr ":27017" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 goto :up
if %tries% GEQ 30 goto :fail
timeout /t 1 /nobreak >nul
goto :waitloop

:up
echo [ok] MongoDB is running on port 27017.
exit /b 0

:fail
echo [!] MongoDB did not start within 30 seconds.
echo.
echo     If you see a "vcruntime140.dll is missing" error, run:
echo     .runtime\mongodb-win\bin\vc_redist.x64.exe
echo     then run start.bat again.
echo.
echo     If Windows SmartScreen appears, click "More info" - "Run anyway".
exit /b 1
