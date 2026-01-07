#!/bin/bash
# Quick Start Script for Vessel Tracking System

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Vessel Tracking System - Quick Start                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Prerequisites Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓${NC} Python 3 installed: $PYTHON_VERSION"
else
    echo -e "${RED}✗${NC} Python 3 not found. Install Python 3.8+"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Install Node.js 14+"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Starting Services${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start Backend
echo ""
echo -e "${YELLOW}1. Starting Backend Server...${NC}"
cd backend
python3 manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
echo -e "${GREEN}   Backend started (PID: $BACKEND_PID)${NC}"
echo -e "   URL: http://localhost:8000"

# Wait for backend to be ready
sleep 3

# Initialize database if needed
if [ ! -s "db.sqlite3" ] || [ ! -f "db.sqlite3" ]; then
    echo ""
    echo -e "${YELLOW}2. Initializing Database...${NC}"
    python3 init_data.py
fi

# Start Frontend
cd ../frontend
echo ""
echo -e "${YELLOW}3. Starting Frontend Server...${NC}"
npm install > /dev/null 2>&1 &
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}   Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "   URL: http://localhost:3000"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ All services started!${NC}"
echo ""
echo -e "${BLUE}📖 Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open http://localhost:3000 in your browser"
echo ""
echo "2. Login with test credentials:"
echo "   Email:    operator@test.com"
echo "   Password: Test1234!"
echo ""
echo "3. Navigate to 'Map View' to see vessels"
echo ""
echo -e "${BLUE}🛑 To Stop Services:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C in this terminal, or run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo -e "${BLUE}📚 Other Test Users:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Analyst:  analyst@test.com  / Test1234!"
echo "Admin:    admin@test.com    / Test1234!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for processes
wait
