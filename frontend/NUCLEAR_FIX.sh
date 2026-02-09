#!/bin/bash

echo "🔥🔥🔥 NUCLEAR RESET - COMPLETE CLEANUP 🔥🔥🔥"
echo "================================================"
echo ""
echo "This will take 5-10 minutes but WILL fix the issue!"
echo ""

cd /Users/sauravkumar/Desktop/Streetconnect/frontend

# Step 1: Kill EVERYTHING
echo "Step 1: Killing ALL processes..."
killall -9 node 2>/dev/null || true
killall -9 watchman 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
sleep 3

# Step 2: Delete ALL caches
echo "Step 2: Deleting ALL caches..."
rm -rf node_modules
rm -rf .expo
rm -rf .metro
rm -rf node_modules/.cache
rm -rf ~/Library/Caches/Expo
rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
watchman shutdown-server 2>/dev/null || true

# Step 3: Clean package lock
echo "Step 3: Cleaning package locks..."
rm -f package-lock.json
rm -f yarn.lock

# Step 4: Reinstall EVERYTHING
echo "Step 4: Reinstalling all dependencies (this takes 3-5 minutes)..."
npm install --legacy-peer-deps

# Step 5: Create symlink
echo "Step 5: Creating worklets symlink..."
cd node_modules
rm -f react-native-worklets
ln -sf react-native-worklets-core react-native-worklets
cd ..

# Step 6: Start Metro
echo ""
echo "Step 6: Starting Metro..."
echo ""
CI=false npm run start:clear

echo ""
echo "================================================"
echo "✅ Complete! Now reload on your phone!"
echo "================================================"
