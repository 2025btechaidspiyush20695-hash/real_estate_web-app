@echo off
REM ============================================================
REM  Gurukripa Estate - Start everything (Windows)
REM  1. Starts the bundled MongoDB (if not already running)
REM  2. Seeds sample data (safe - only adds what is missing)
REM  3. Runs API (:5000) + Website (:5173) + Admin (:5174)
REM ============================================================
setlocal
cd /d "%~dp0"

call scripts\start-mongodb.bat
if errorlevel 1 goto :mongoerr

echo [..] Seeding sample data - skips anything that already exists
call npm --prefix server run seed

echo.
echo ============================================
echo  Gurukripa Estate is starting...
echo  API     : http://localhost:5000
echo  Website : http://localhost:5173
echo  Admin   : http://localhost:5174
echo.
echo  Press Ctrl+C to stop all servers.
echo ============================================
echo.

call npm run dev
pause
exit /b 0

:mongoerr
echo [!!] Could not start MongoDB. See the message above.
pause
exit /b 1
