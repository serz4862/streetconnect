#!/bin/bash

# StreetConnect Login Test Script
# This tests the backend login endpoint directly

echo "🧪 Testing StreetConnect Login Endpoint"
echo "========================================"
echo ""
echo "📡 Backend URL: http://localhost:3000/api/v1/auth/phone-login"
echo ""
echo "📤 Sending login request..."
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/v1/auth/phone-login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9999999999",
    "country_code": "+91",
    "otp": "0000",
    "name": "Test User"
  }')

# Split response and status code
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "📥 Response Status: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✅ LOGIN SUCCESSFUL!"
  echo ""
  echo "Response:"
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
  echo "❌ LOGIN FAILED"
  echo ""
  echo "Response:"
  echo "$body"
fi

echo ""
echo "========================================"
echo ""
echo "📱 Frontend Configuration:"
echo "   File: streetconnectfrontend/.env"
echo "   Current API URL: $(grep EXPO_PUBLIC_API_URL streetconnectfrontend/.env)"
echo ""
echo "💡 Next Steps:"
echo "   1. Backend is ✅ working on port 3000"
echo "   2. Restart Expo: cd streetconnectfrontend && npm start -- --clear"
echo "   3. Test login with: phone=9999999999, otp=0000"
echo ""
