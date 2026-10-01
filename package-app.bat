@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   StockMaster POS - Packageur d'Application Desktop
echo ========================================================
echo.

set "PATH=C:\Users\ka tech\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64;%PATH%"

echo [1/4] Compilation des assets React / Vite...
cd stockmaster-pos
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec de la compilation du frontend Vite.
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [2/4] Compilation de l'executable natif StockMasterPOS.exe...
"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /target:winexe /win32icon:"%~dp0stockmaster.ico" /r:System.dll,System.Drawing.dll,System.Windows.Forms.dll,System.Management.dll /out:"%~dp0StockMasterPOS.exe" "%~dp0Launcher.cs"
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec de la compilation C#.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/4] Mise a jour du package portable StockMaster-POS-Standalone...
if not exist "%~dp0StockMaster-POS-Standalone" mkdir "%~dp0StockMaster-POS-Standalone"
copy /y "%~dp0StockMasterPOS.exe" "%~dp0StockMaster-POS-Standalone\StockMasterPOS.exe" >nul
copy /y "%~dp0stockmaster.ico" "%~dp0StockMaster-POS-Standalone\stockmaster.ico" >nul
xcopy /s /e /y /i "%~dp0stockmaster-pos\dist" "%~dp0StockMaster-POS-Standalone\dist" >nul

echo.
echo [4/4] Creation du raccourci sur le Bureau...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\StockMaster POS.lnk'); $s.TargetPath = '%~dp0StockMasterPOS.exe'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%~dp0stockmaster.ico,0'; $s.Description = 'StockMaster POS - Gestion de Stock & Caisse'; $s.Save()"

echo.
echo ========================================================
echo   SUCCES ! L'application est prete.
echo   Le raccourci 'StockMaster POS' est sur votre Bureau.
echo ========================================================
echo.
pause