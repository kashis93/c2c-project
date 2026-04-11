@echo off
REM AluVerse Alumni Platform - Quick Start for Windows
REM Run this to start both frontend and backend

echo.
echo ===========================================================
echo   AluVerse Alumni Platform - Quick Start
echo ===========================================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i

echo [OK] Node.js version: %NODE_VER%
echo [OK] npm version: %NPM_VER%
echo.

REM Check backend .env
echo Checking backend configuration...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo [WARN] backend\.env not found. Creating from .env.example...
        copy backend\.env.example backend\.env
        echo [WARN] Please edit backend\.env with your MongoDB URI
        echo.
        echo Required settings:
        echo   - MONGODB_URI: Your MongoDB connection string
        echo   - JWT_SECRET: Any secret string for JWT
        echo   - FRONTEND_URL: http://localhost:5173
        echo.
        pause
    ) else (
        echo [ERROR] backend\.env.example not found!
        pause
        exit /b 1
    )
)

REM Check frontend .env
echo Checking frontend configuration...
if not exist "alunet93\.env.local" (
    (
        echo VITE_API_URL=http://localhost:4000/api
    ) > alunet93\.env.local
    echo [OK] Frontend .env.local created
)

echo.
echo ===========================================================
echo   Installing Dependencies
echo ===========================================================
echo.

REM Backend setup
echo [1/2] Setting up backend...
cd backend
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Backend npm install failed
        pause
        exit /b 1
    )
) else (
    echo [OK] Backend dependencies already installed
)
cd ..
echo [OK] Backend ready
echo.

REM Frontend setup
echo [2/2] Setting up frontend...
cd alunet93
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Frontend npm install failed
        pause
        exit /b 1
    )
) else (
    echo [OK] Frontend dependencies already installed
)
cd ..
echo [OK] Frontend ready
echo.

echo ===========================================================
echo   Setup Complete!
echo ===========================================================
echo.
echo [INFO] Starting both servers in new terminal windows...
echo.

REM Start backend in new window
echo Starting Backend Server (port 4000)...
start "AluVerse Backend" cmd /k "cd backend && npm start"

REM Wait for backend to start
timeout /t 3 /nobreak

REM Start frontend in new window
echo Starting Frontend Server (port 5173)...
start "AluVerse Frontend" cmd /k "cd alunet93 && npm run dev"

echo.
echo ===========================================================
echo   Success!
echo ===========================================================
echo.
echo [OK] Backend: http://localhost:4000
echo [OK] Frontend: http://localhost:5173
echo.
echo [INFO] Two terminal windows should open:
echo   1. Backend terminal (running Node.js server)
echo   2. Frontend terminal (running Vite dev server)
echo.
echo [INFO] Close each terminal window to stop that server
echo [INFO] Or press Ctrl+C in each terminal
echo.
pause
