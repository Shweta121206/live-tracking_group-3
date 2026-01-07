#!/bin/bash

echo "=== Vessel Tracking API Debugging ==="
echo ""

# Check if backend is running
echo "1. Checking if backend is running on port 8000..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/ || echo "FAILED"
echo ""

# Check if database exists
echo "2. Checking database..."
ls -lh ../db.sqlite3 2>/dev/null || echo "Database not found"
echo ""

# Try to get vessels without auth (public endpoint)
echo "3. Checking public vessel endpoints..."
curl -s http://localhost:8000/api/vessels/ -w "\nStatus: %{http_code}\n" 2>&1 | head -20
echo ""

# Check settings
echo "4. Checking Django settings..."
python3 manage.py shell -c "from django.conf import settings; print('DEBUG:', settings.DEBUG); print('ALLOWED_HOSTS:', settings.ALLOWED_HOSTS[:3])" 2>&1 | head -5
echo ""

echo "=== Done ==="
