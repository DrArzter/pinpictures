@echo off
:menu
cls
echo Select an option:
echo 1. Start MySQL80 service
echo 2. Stop MySQL80 service
echo 3. Exit
set /p choice=Enter your choice (1, 2, or 3): 

if "%choice%"=="1" (
    net start MySQL80
    echo MySQL80 service started successfully.
    pause
    goto menu
)

if "%choice%"=="2" (
    net stop MySQL80
    echo MySQL80 service stopped successfully.
    pause
    goto menu
)

if "%choice%"=="3" (
    exit
)

echo Invalid choice. Please enter a valid option (1, 2, or 3).
pause
goto menu
