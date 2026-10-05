@echo off
REM ============================================================
REM  Gurukripa Estate - Windows one-time setup
REM  Installs dependencies, ensures VC++ runtime, starts the
REM  BUNDLED MongoDB (no installation needed) and seeds data.
REM  Works in cmd.exe and old PowerShell (no && needed).
REM ============================================================
setlocal
cd /d "%~dp0"

echo ============================================
echo  Gurukripa Estate - Setup - Windows
echo  MongoDB is bundled - nothing to install!
echo ============================================
echo.
echo [0/4] Ensuring Microsoft Visual C++ runtime...
if exist ".runtime\mongodb-win\bin\vc_redist.x64.exe" goto :runvc
echo [ok] Skipped - not bundled.
goto :deps

:runvc
echo [..] Running VC++ runtime installer - a UAC prompt may appear...
".runtime\mongodb-win\bin\vc_redist.x64.exe" /install /quiet /norestart
echo [ok] VC++ runtime ensured.

:deps
echo.
echo [1/4] Installing root dependencies...
call npm install
if errorlevel 1 goto :fail
echo.
echo [2/4] Installing server dependencies...
call npm --prefix server install
if errorlevel 1 goto :fail
echo.
echo [3/4] Installing client dependencies...
call npm --prefix client install
if errorlevel 1 goto :fail
echo.
echo [4/4] Installing admin dependencies...
call npm --prefix admin install
if errorlevel 1 goto :fail

echo.
echo [..] Starting MongoDB and seeding data...
call scripts\setup-windows.bat
if errorlevel 1 goto :fail

echo.
echo ============================================
echo  Done! Launch everything with:  start.bat
echo  Website : http://localhost:5173
echo  Admin   : http://localhost:5174
for /f "tokens=2 delims==" %%a in ('findstr "ADMIN_EMAIL" server\.env 2^>nul') do set AEMAIL=%%a
echo  Login   : %AEMAIL% / admin123 (fresh install)
echo ============================================
pause
exit /b 0

:fail
echo.
echo [!!] Something failed - read the message above.
pause
exit /b 1
