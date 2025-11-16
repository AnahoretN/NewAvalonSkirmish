@echo off
REM Set the target folder
set "TARGET_DIR=C:\Users\AnahoretPC\Documents\new-avalon_-skirmish"

echo.
echo Go to directory: %TARGET_DIR%
cd "%TARGET_DIR%"

echo.
echo Launch: npm run dev (Start in development mode)
npm run dev

pause