#!/bin/bash

# StreetConnect - Complete Restart for Phone Testing

echo "🔄 Restarting StreetConnect for Phone Testing"
echo "=============================================="
echo ""

# Kill existing processes
echo "🛑 Stopping existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null
sleep 2

# Start backend
echo "🚀 Starting backend on port 3000..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 5

# Check backend health
if curl -s http://localhost:3000/health > /dev/null; then
  echo "✅ Backend is running!"
else
  echo "❌ Backend failed to start. Check backend.log"
  exit 1
fi

# Start frontend with tunnel mode (works on any network)
echo ""
echo "🌐 Starting Expo in TUNNEL mode..."
echo "   (This works even if phone is on different WiFi)"
echo ""
cd streetconnectfrontend
npx expo start --tunnel --clear &
EXPO_PID=$!
cd ..

echo ""
echo "=============================================="
echo "✅ All Services Started!"
echo ""
echo "📱 On Your Phone:"
echo "   1. Open Expo Go app"
echo "   2. Scan the QR code that appears"
echo "   3. Login with:"
echo "      Phone: 9999999999"
echo "      OTP: 0000"
echo ""
echo "💡 Using TUNNEL mode - works on any network!"
echo ""
echo "Process IDs:"
echo "  Backend: $BACKEND_PID"
echo "  Expo: $EXPO_PID"
echo ""
echo "To stop: pkill -f 'node.*expo' && lsof -ti:3000 | xargs kill"
echo ""
