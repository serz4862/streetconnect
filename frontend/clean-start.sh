#!/bin/bash

# StreetConnect - Clean Start Script
# Run this in your terminal: bash clean-start.sh

echo "🧹 Cleaning everything..."
killall -9 node 2>/dev/null || true
killall -9 watchman 2>/dev/null || true
sleep 2

cd "$(dirname "$0")"
rm -rf node_modules/.cache .expo
echo "✅ Caches cleared"
echo ""

# Ensure symlink exists
cd node_modules 2>/dev/null || { echo "❌ node_modules not found. Run 'npm install' first."; exit 1; }
if [ ! -L "react-native-worklets" ]; then
    ln -sf react-native-worklets-core react-native-worklets
    echo "✅ Worklets symlink created"
fi
cd ..

echo ""
echo "🚀 Starting Metro Bundler..."
echo "   Please wait 30-60 seconds for initial build..."
echo ""

# Unset CI and start
export CI=false
npm run start:clear
