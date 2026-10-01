@echo off
set "PATH=C:\Users\ka tech\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64;%PATH%"
cd /d "%~dp0\stockmaster-pos"
echo ========================================================
echo   StockMaster POS - Gestion de Stock & Caisse
echo ========================================================
echo Lancement du serveur de developpement...
echo URL: http://localhost:5173
echo.
npm run dev
pause
