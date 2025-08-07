#!/bin/bash

# Server Status Management Script for Sustainable Habit Tracker Sprint 3

check_status() {
    echo "=== Server Status Check ==="
    
    # Check backend server (port 5002)
    if curl -s http://localhost:5002 > /dev/null 2>&1; then
        echo "✅ Backend server is running on port 5002"
    else
        echo "❌ Backend server is not responding on port 5002"
    fi
    
    # Check frontend server (port 3000)
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend server is running on port 3000"
    else
        echo "❌ Frontend server is not responding on port 3000"
    fi
    
    # Show running processes
    echo -e "\n=== Running Node/NPM Processes ==="
    ps aux | grep -E "(node|npm)" | grep -v grep | grep -E "(server\.js|react-scripts)" || echo "No relevant processes found"
}

stop_servers() {
    echo "=== Stopping Servers ==="
    
    # Kill backend processes
    pkill -f "node server.js"
    pkill -f "npm start" | grep -v react-scripts
    
    # Kill frontend processes
    pkill -f "react-scripts"
    
    echo "Servers stopped"
    sleep 2
    check_status
}

start_servers() {
    echo "=== Starting Servers ==="
    
    # Start backend server
    echo "Starting backend server..."
    cd /Users/apple/Desktop/sustainable_habit_tracker/sprint3
    npm start > backend.log 2>&1 &
    
    # Start frontend server
    echo "Starting frontend server..."
    cd /Users/apple/Desktop/sustainable_habit_tracker/sprint3/view
    npm start > frontend.log 2>&1 &
    
    echo "Servers starting... Please wait a few seconds"
    sleep 5
    check_status
}

restart_servers() {
    echo "=== Restarting Servers ==="
    stop_servers
    sleep 3
    start_servers
}

case "$1" in
    "status")
        check_status
        ;;
    "stop")
        stop_servers
        ;;
    "start")
        start_servers
        ;;
    "restart")
        restart_servers
        ;;
    *)
        echo "Usage: $0 {status|start|stop|restart}"
        echo ""
        echo "Commands:"
        echo "  status   - Check if servers are running"
        echo "  start    - Start both servers"
        echo "  stop     - Stop both servers"
        echo "  restart  - Restart both servers"
        ;;
esac
