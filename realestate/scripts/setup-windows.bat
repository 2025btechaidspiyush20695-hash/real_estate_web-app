@echo off
REM ============================================================
REM  Gurukripa Estate - Windows: start bundled MongoDB + seed data
REM  (called by setup.bat, or run it directly)
REM ============================================================
cd /d "%~dp0\.."

call scripts\start-mongodb.bat
if errorlevel 1 goto :mongoerr

echo [..] Seeding database - admin user, 9 properties, site content
call npm --prefix server run seed
if errorlevel 1 goto :seederr
echo [ok] Database seeded.
exit /b 0

:mongoerr
exit /b 1

:seederr
echo.
echo [!!] Seeding failed - is MongoDB running on port 27017?
pause
exit /b 1
