#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========== Vessel Tracking System Checker ==========${NC}\n"

# Check 1: Backend running
echo -e "${YELLOW}1. Checking if Backend is running...${NC}"
if curl -s http://localhost:8000/api/ >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on http://localhost:8000${NC}"
else
    echo -e "${RED}✗ Backend NOT running. Start with: cd backend && python3 manage.py runserver${NC}"
    exit 1
fi

# Check 2: Database
echo -e "\n${YELLOW}2. Checking database...${NC}"
if [ -s backend/db.sqlite3 ]; then
    SIZE=$(du -h backend/db.sqlite3 | cut -f1)
    echo -e "${GREEN}✓ Database exists (${SIZE})${NC}"
else
    echo -e "${RED}✗ Database is empty. Run: cd backend && python3 init_data.py${NC}"
    exit 1
fi

# Check 3: Test login
echo -e "\n${YELLOW}3. Testing authentication...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@test.com","password":"Test1234!"}')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Authentication working${NC}"
    
    # Check 4: Real-time API
    echo -e "\n${YELLOW}4. Testing Real-Time Vessels API...${NC}"
    API_RESPONSE=$(curl -s "http://localhost:8000/api/vessels/realtime_positions/" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$API_RESPONSE" | grep -q "vessels"; then
        VESSEL_COUNT=$(echo "$API_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✓ API working - Found ${VESSEL_COUNT} vessels${NC}"
    else
        echo -e "${RED}✗ API not responding correctly${NC}"
        echo "$API_RESPONSE" | head -5
    fi
else
    echo -e "${RED}✗ Authentication failed. Check database initialization${NC}"
    echo "$LOGIN_RESPONSE" | head -5
    exit 1
fi

# Check 5: Frontend
echo -e "\n${YELLOW}5. Checking Frontend...${NC}"
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running on http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not running yet. Start with: cd frontend && npm start${NC}"
fi

echo -e "\n${BLUE}==================================================${NC}"
echo -e "${GREEN}✓ All systems ready!${NC}"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000 in browser"
echo "2. Login with: operator@test.com / Test1234!"
echo "3. Navigate to Map View to see vessels"
echo ""
