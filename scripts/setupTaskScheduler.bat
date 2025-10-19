@echo off
echo 🔧 SETTING UP WINDOWS TASK SCHEDULER...
echo ========================================
echo.

echo 📋 Creating scheduled task to start PDF webhook server on boot...
echo.

REM Create a task that starts the webhook server on system startup
schtasks /create /tn "PDF Webhook Server" /tr "node \"%cd%\scripts\webhookServer.js\"" /sc onstart /ru "SYSTEM" /f

if %errorlevel% equ 0 (
    echo ✅ Task created successfully!
    echo 🔄 PDF Webhook Server will start automatically on boot
    echo 📱 Your app will always have access to automatic PDF fetching
) else (
    echo ❌ Failed to create task. Please run as Administrator.
)

echo.
echo 📋 To manage the task:
echo    • View: schtasks /query /tn "PDF Webhook Server"
echo    • Delete: schtasks /delete /tn "PDF Webhook Server" /f
echo    • Run now: schtasks /run /tn "PDF Webhook Server"
echo.
pause
