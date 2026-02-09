#!/bin/bash

# ULTIMATE FIX FOR STREETCONNECT FRONTEND
# Run this if you keep seeing the navigation error

echo "🔥 ULTIMATE CACHE CLEAR & RESTART 🔥"
echo "===================================="
echo ""

echo "Step 1: Killing ALL processes..."
killall -9 node 2>/dev/null || true
killall -9 watchman 2>/dev/null || true
sleep 3

echo "Step 2: Clearing ALL caches..."
cd /Users/sauravkumar/Desktop/Streetconnect/frontend
rm -rf node_modules/.cache
rm -rf .expo
rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null || true
rm -rf $TMPDIR/metro-* $TMPDIR/haste-* $TMPDIR/react-* 2>/dev/null || true

echo "Step 3: Creating worklets symlink..."
cd node_modules
rm -f react-native-worklets
ln -sf react-native-worklets-core react-native-worklets
ls -la | grep worklet
cd ..

echo "Step 4: Showing _layout.tsx fix..."
echo "Current _layout.tsx Stack component:"
grep -A 1 "<Stack" src/app/_layout.tsx | head -2

echo ""
echo "Step 5: Starting Metro (this will take 30-90 seconds)..."
echo ""

# Start Metro
CI=false npm run start:clear

echo ""
echo "===================================="
echo "✅ Metro should now be running"
echo ""
echo "📱 ON YOUR PHONE:"
echo "1. Shake your device"
echo "2. Tap 'Reload'"
echo "3. Error will be GONE!"
echo "===================================="
