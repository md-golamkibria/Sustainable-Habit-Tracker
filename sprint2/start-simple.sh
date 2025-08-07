#!/bin/bash

# Simple Sprint 2 Startup Script
# This script starts both backend and frontend without nodemon/react-scripts

echo "🚀 Starting Sprint 2 Backend and Frontend..."
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env file with your actual configuration"
fi

echo -e "${BLUE}📦 Backend dependencies already installed${NC}"
echo -e "${BLUE}📦 Frontend dependencies already installed${NC}"

# Start backend directly with node
echo -e "${BLUE}🔄 Starting backend server on port 5002...${NC}"
node server.js &
BACKEND_PID=$!

# Start frontend
echo -e "${BLUE}🎨 Starting frontend React app on port 3000...${NC}"
cd view
npm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅ Sprint 2 is now running!${NC}"
echo ""
echo "📊 Backend API: http://localhost:5002"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "To stop both services:"
echo "  pkill -f 'node server.js'"
echo "  pkill -f 'npm start'"
echo ""
echo "Process IDs:"
echo "  Backend PID: $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
