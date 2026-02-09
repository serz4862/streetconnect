#!/usr/bin/env bash
# StreetConnect - Complete Fast Startup

set -e
cd "$(dirname "$0")"

echo "🚀 StreetConnect - Complete Startup"
echo ""

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Starting Redis..."
    redis-server --daemonize yes
    sleep 1
fi
echo "✅ Redis: Running"

# Check backend
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "🔧 Starting Backend..."
    cd backend
    node dist/server.js > /tmp/streetconnect-backend.log 2>&1 &
    cd ..
    echo "⏳ Waiting for backend..."
    sleep 8
fi
echo "✅ Backend: Running on http://192.168.1.2:3000"

# Start frontend
echo ""
echo "📱 Starting Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Choose your option:"
echo ""
echo "   For Phone (Expo Go): Scan the QR code below"
echo "   For iOS Simulator: Press 'i'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd frontend
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.2 npx expo start --clear
