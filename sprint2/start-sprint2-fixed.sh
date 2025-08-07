#!/bin/bash

# Sprint 2 Fix - Start Backend and Frontend Together
# This script fixes the Sprint 2 startup issues

echo "🚀 Starting Sprint 2 Backend and Frontend..."
echo "=============================================="

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please update .env file with your actual configuration before running again"
    echo "   Then run: ./start-sprint2-fixed.sh"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd sprint2
npm install

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd view
npm install

echo -e "${BLUE}🔄 Starting backend server on port 5002...${NC}"
cd ..
# Start backend in background
npm run server &
BACKEND_PID=$!

echo -e "${BLUE}🎨 Starting frontend React app on port 3000...${NC}"
cd view
# Start frontend in background
npm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅ Sprint 2 is now running!${NC}"
echo ""
echo "📊 Backend API: http://localhost:5002"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "To stop both services:"
echo "  ./stop-servers.sh"
echo ""
echo "Process IDs:"
echo "  Backend PID: $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"

# Save PIDs for stopping
echo "$BACKEND_PID" > ../backend.pid
echo "$FRONTEND_PID" > ../frontend.pid

# Wait for both processes
wait
