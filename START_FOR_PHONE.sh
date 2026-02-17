#!/bin/bash

# StreetConnect - Start for Physical Phone

echo "📱 Starting StreetConnect for Physical Phone Testing"
echo "===================================================="
echo ""
echo "✅ Backend should already be running on port 3000"
echo "✅ Frontend .env updated to use: http://192.168.1.3:3000/api/v1"
echo ""
echo "🔄 Restarting Expo with cleared cache..."
echo ""

cd streetconnectfrontend

# Kill any existing Expo processes
lsof -ti:8081 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

# Clear cache and start
npx expo start --clear --host tunnel &

echo ""
echo "⏳ Waiting for Expo to start..."
sleep 8

echo ""
echo "===================================================="
echo "✅ Expo Dev Server Started!"
echo ""
echo "📱 On Your Phone:"
echo "   1. Open Expo Go app"
echo "   2. Scan the QR code in the terminal"
echo "   3. Login with:"
echo "      Phone: 9999999999"
echo "      Code: +91"
echo "      OTP: 0000 or 000000"
echo ""
echo "💡 Make sure your phone and computer are on the SAME WiFi"
echo ""
echo "🔍 Troubleshooting:"
echo "   - If connection fails, check firewall settings"
echo "   - Verify both devices on same WiFi network"
echo "   - Computer IP: 192.168.1.3"
echo ""
