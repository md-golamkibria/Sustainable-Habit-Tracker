#!/bin/bash

# Navigate to Sprint 3 directory
cd /Users/apple/Desktop/sustainable_habit_tracker/sprint3

echo "Starting Sprint 3 Sustainable Habit Tracker..."
echo "========================================"

# Start backend server in background
echo "Starting backend server on port 5002..."
nohup node server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
echo "Backend server started with PID: $BACKEND_PID"

# Wait a moment for backend to initialize
sleep 3

# Start frontend server in background
echo "Starting frontend server on port 3000..."
cd view
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..
echo "Frontend server started with PID: $FRONTEND_PID"

echo ""
echo "✅ Sprint 3 servers are starting up..."
echo "Backend: http://localhost:5002"
echo "Frontend: http://localhost:3000"
echo ""
echo "To monitor logs:"
echo "  Backend: tail -f /Users/apple/Desktop/sustainable_habit_tracker/sprint3/backend.log"
echo "  Frontend: tail -f /Users/apple/Desktop/sustainable_habit_tracker/sprint3/frontend.log"
echo ""
echo "To stop servers: kill -9 $BACKEND_PID $FRONTEND_PID"
echo "PIDs saved in backend.pid and frontend.pid files"

# Wait a moment and check server status
sleep 5
echo ""
echo "Checking server status..."

# Check if backend is responding
if curl -s http://localhost:5002/api/health > /dev/null 2>&1; then
    echo "✅ Backend server is responding on port 5002"
else
    echo "⚠️  Backend server may still be starting up..."
fi

# Check if frontend port is active
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Frontend server is active on port 3000"
else
    echo "⚠️  Frontend server may still be starting up..."
fi

echo ""
echo "Servers are running in background. Check logs for details."
