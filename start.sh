#!/usr/bin/env bash
# StreetConnect - Fast Local Run (No Docker needed!)

set -e
cd "$(dirname "$0")"

echo "🚀 Starting StreetConnect Locally (FAST MODE)"
echo ""

# Check if databases are running
echo "📊 Checking PostgreSQL..."
if pgrep -x postgres > /dev/null || pgrep -x Postgres > /dev/null; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running"
    echo "Start it with: brew services start postgresql@14"
    exit 1
fi

echo "📊 Checking Redis..."
if pgrep -x redis-server > /dev/null; then
    echo "✅ Redis is running"
else
    echo "⚠️  Starting Redis..."
    redis-server --daemonize yes
    sleep 1
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis started"
    else
        echo "❌ Failed to start Redis"
        exit 1
    fi
fi

# Create database if it doesn't exist
echo ""
echo "📦 Setting up database..."
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw streetconnect_db; then
    echo "✅ Database exists"
else
    echo "⚠️  Creating database..."
    createdb streetconnect_db 2>/dev/null || true
    echo "✅ Database created"
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo ""
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo ""
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "✅ All services ready!"
echo ""
echo "🎯 Starting Backend on http://localhost:5000"
echo "🎯 Starting Frontend on http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start both backend and frontend
if command -v concurrently >/dev/null 2>&1; then
    npm run dev
else
    echo "Installing concurrently..."
    npm install
    npm run dev
fi
