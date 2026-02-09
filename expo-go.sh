#!/usr/bin/env bash
# StreetConnect - Start with Expo Go Support

set -e
cd "$(dirname "$0")"

echo "🚀 Starting StreetConnect for Expo Go"
echo ""
echo "Your Computer IP: 192.168.1.2"
echo "Backend will run on: http://192.168.1.2:3000"
echo "Frontend will run on: exp://192.168.1.2:8081"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "ts-node src/server.ts" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
sleep 2

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Starting Redis..."
    redis-server --daemonize yes
    sleep 1
fi

# Start backend in background
echo "🔧 Starting Backend on port 3000..."
cd backend
npm run dev > /tmp/streetconnect-backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "Backend PID: $BACKEND_PID"
sleep 3

# Start frontend with network hostname
echo "📱 Starting Frontend with network access..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ READY! Use Expo Go on your phone:"
echo "   1. Open Expo Go app"
echo "   2. Scan the QR code below"
echo "   3. Wait for app to load"
echo ""
echo "OR press 'i' for iOS Simulator (fastest!)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd frontend
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.2 npx expo start --tunnel
