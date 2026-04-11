#!/bin/bash

# AluVerse Alumni Platform - Quick Start Script
# Run this script to start both frontend and backend

echo "🚀 AluVerse Alumni Platform - Quick Start"
echo "==========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Check backend .env
echo "📝 Checking backend configuration..."
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        echo "⚠️  backend/.env not found. Creating from .env.example..."
        cp backend/.env.example backend/.env
        echo "⚠️  Please edit backend/.env with your MongoDB URI and other settings"
        echo ""
        echo "Required settings in backend/.env:"
        echo "  - MONGODB_URI: Your MongoDB connection string"
        echo "  - JWT_SECRET: Any secret string for JWT tokens"
        echo "  - FRONTEND_URL: http://localhost:5173 (for development)"
        echo ""
        read -p "Press ENTER after editing backend/.env..."
    else
        echo "❌ backend/.env.example not found!"
        exit 1
    fi
fi

# Check frontend .env
echo ""
echo "📝 Checking frontend configuration..."
if [ ! -f "alunet93/.env.local" ]; then
    echo "Creating frontend/.env.local"
    cat > alunet93/.env.local << EOF
VITE_API_URL=http://localhost:4000/api
EOF
    echo "✅ Frontend .env.local created"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Backend setup
echo "1️⃣  Setting up backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Backend npm install failed"
        exit 1
    fi
else
    echo "✅ Backend dependencies already installed"
fi
cd ..
echo "✅ Backend ready"

# Frontend setup
echo ""
echo "2️⃣  Setting up frontend..."
cd alunet93
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Frontend npm install failed"
        exit 1
    fi
else
    echo "✅ Frontend dependencies already installed"
fi
cd ..
echo "✅ Frontend ready"

echo ""
echo "==========================================="
echo "✅ Setup Complete!"
echo "==========================================="
echo ""
echo "🚀 Starting the application..."
echo ""
echo "Opening backend server (port 4000)..."
echo "Opening frontend server (port 5173)..."
echo ""

# Start backend in background
cd backend
npm start > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
cd alunet93
echo ""
echo "Starting frontend... (Press Ctrl+C to stop both servers)"
echo ""
npm run dev
FRONTEND_PID=$!

# Cleanup on exit
trap "echo 'Stopping servers...'; kill $BACKEND_PID 2>/dev/null; exit" EXIT

wait
