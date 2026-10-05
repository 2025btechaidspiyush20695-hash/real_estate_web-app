@echo off
REM ============================================================
REM  Gurukripa Estate - PRODUCTION mode (Windows)
REM  Agar dev mode (start.bat) me white screen / ad-blocker
REM  problem ho, to ye use karo. Production me sab kuch EK
REM  bundled file me aata hai - extensions block nahi kar
REM  paate.
REM
REM  Website : http://localhost:5000
REM  Admin   : http://localhost:5000/admin
REM ============================================================
setlocal
cd /d "%~dp0"

echo ============================================
echo  Gurukripa Estate - Production Mode
echo ============================================
echo.

call scripts\start-mongodb.bat
if errorlevel 1 goto :mongoerr

echo [..] Seeding sample data (safe - only adds missing)...
call npm --prefix server run seed

echo [..] Building website + admin (1-2 minute)...
call npm --prefix client run build
if errorlevel 1 goto :fail
call npm --prefix admin run build
if errorlevel 1 goto :fail

echo.
echo ============================================
echo  Running production server...
echo  Website : http://localhost:5000
echo  Admin   : http://localhost:5000/admin
echo  (fresh install par .env ka ADMIN_EMAIL / admin123)
echo.
echo  Ctrl+C to stop.
echo ============================================
echo.

set NODE_ENV=production
call npm --prefix server start
pause
exit /b 0

:mongoerr
echo [!!] Could not start MongoDB. See the message above.
pause
exit /b 1

:fail
echo [!!] Build failed - see the error above.
pause
exit /b 1
