#!/usr/bin/env bash
# StreetConnect - Quick Start Script
# Run: ./quick-start.sh

set -e
cd "$(dirname "$0")"

echo "🚀 Starting StreetConnect..."
echo ""

# Check if Postgres is running
if docker ps | grep -q streetconnect_postgres; then
  echo "✅ Postgres is already running"
else
  echo "📦 Starting Postgres..."
  docker-compose up -d postgres
  echo "⏳ Waiting for Postgres to be ready..."
  sleep 3
fi

echo ""
echo "✅ All services ready!"
echo ""
echo "📝 Next steps:"
echo ""
echo "  1. Start Backend (in new terminal):"
echo "     cd backend && npm run dev"
echo ""
echo "  2. Start Frontend (in new terminal):"
echo "     cd frontend && npm run start:clear"
echo ""
echo "  3. Open Expo Go on your phone and scan the QR code"
echo ""
echo "  4. Login with:"
echo "     Phone: 9876543210"
echo "     OTP: 0000"
echo ""
echo "📖 See START_APP.md for detailed instructions"
echo ""
