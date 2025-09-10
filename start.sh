#!/bin/bash

echo "🚀 Starting DomaInsight - AI-Driven Domain Scoring & Predictive Analytics"
echo ""
echo "This will start both the backend API server and frontend React app"
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:3000"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start both servers
echo "🚀 Starting servers..."
cd backend && npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

cd ../frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ DomaInsight is starting up!"
echo ""
echo "Backend API: http://localhost:3001"
echo "Frontend App: http://localhost:3000"
echo ""
echo "Features:"
echo "- AI Domain Scoring (0-100)"
echo "- Trend Analytics Dashboard"
echo "- Actionable Recommendations"
echo "- Multi-chain Support"
echo "- Real-time Alerts"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down DomaInsight..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to stop
echo "Press Ctrl+C to stop the servers..."
wait
