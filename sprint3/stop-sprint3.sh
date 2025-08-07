#!/bin/bash

cd /Users/apple/Desktop/sustainable_habit_tracker/sprint3

echo "Stopping Sprint 3 Sustainable Habit Tracker servers..."

# Stop backend server
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    echo "Stopping backend server (PID: $BACKEND_PID)..."
    kill -9 $BACKEND_PID 2>/dev/null
    rm backend.pid
    echo "✅ Backend server stopped"
else
    echo "⚠️  No backend PID file found"
fi

# Stop frontend server
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    echo "Stopping frontend server (PID: $FRONTEND_PID)..."
    kill -9 $FRONTEND_PID 2>/dev/null
    rm frontend.pid
    echo "✅ Frontend server stopped"
else
    echo "⚠️  No frontend PID file found"
fi

# Clean up any remaining processes
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null

echo ""
echo "🛑 All Sprint 3 servers have been stopped"
