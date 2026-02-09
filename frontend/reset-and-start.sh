#!/bin/bash

echo "🔧 StreetConnect Frontend - Complete Reset & Restart"
echo "=================================================="
echo ""

# Step 1: Kill all Metro/Expo processes
echo "1️⃣ Killing all Metro/Expo processes..."
pkill -9 -f "expo" 2>/dev/null || true
pkill -9 -f "metro" 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
sleep 2
echo "   ✓ Processes killed"
echo ""

# Step 2: Clean all caches
echo "2️⃣ Cleaning all caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
echo "   ✓ Caches cleaned"
echo ""

# Step 3: Verify worklets symlink
echo "3️⃣ Verifying worklets symlink..."
cd node_modules
if [ -L "react-native-worklets" ]; then
    echo "   ✓ Symlink exists"
else
    ln -sf react-native-worklets-core react-native-worklets
    echo "   ✓ Symlink created"
fi
cd ..
echo ""

# Step 4: Verify _layout.tsx is correct
echo "4️⃣ Verifying _layout.tsx fix..."
if grep -q "<Stack\s*\/>" src/app/_layout.tsx; then
    echo "   ✓ Root layout is correct (self-closing Stack)"
else
    echo "   ⚠️  WARNING: Root layout may need manual fix"
fi
echo ""

# Step 5: Start Metro with clear cache
echo "5️⃣ Starting Metro with fresh cache..."
echo "   This will take about 30-60 seconds..."
echo ""
echo "=================================================="
echo ""

# Start Metro
CI=false npm run start:clear
