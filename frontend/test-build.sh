#!/bin/bash

echo "====================================="
echo "StreetConnect Frontend Build Test"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if Metro is running
echo "1. Checking Metro Bundler..."
if curl -s http://localhost:8081/status | grep -q "running"; then
    echo -e "${GREEN}✓ Metro Bundler is running${NC}"
else
    echo -e "${RED}✗ Metro Bundler is not running${NC}"
    exit 1
fi

echo ""

# Test 2: Build iOS bundle
echo "2. Testing iOS bundle build..."
if curl -s "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false" > /tmp/ios-bundle.js 2>&1; then
    SIZE=$(wc -c < /tmp/ios-bundle.js | tr -d ' ')
    if [ "$SIZE" -gt 1000 ]; then
        echo -e "${GREEN}✓ iOS bundle built successfully ($SIZE bytes)${NC}"
    else
        echo -e "${RED}✗ iOS bundle is too small ($SIZE bytes)${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ iOS bundle build failed${NC}"
    exit 1
fi

echo ""

# Test 3: Build Android bundle
echo "3. Testing Android bundle build..."
if curl -s "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" > /tmp/android-bundle.js 2>&1; then
    SIZE=$(wc -c < /tmp/android-bundle.js | tr -d ' ')
    if [ "$SIZE" -gt 1000 ]; then
        echo -e "${GREEN}✓ Android bundle built successfully ($SIZE bytes)${NC}"
    else
        echo -e "${RED}✗ Android bundle is too small ($SIZE bytes)${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Android bundle build failed${NC}"
    exit 1
fi

echo ""

# Test 4: TypeScript check
echo "4. Running TypeScript type check..."
if npm run type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✓ TypeScript compilation passed${NC}"
else
    echo -e "${RED}✗ TypeScript compilation failed${NC}"
    exit 1
fi

echo ""

# Cleanup
rm -f /tmp/ios-bundle.js /tmp/android-bundle.js

echo "====================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "====================================="
echo ""
echo "Your frontend is working correctly:"
echo "  • Metro Bundler: Running on http://localhost:8081"
echo "  • iOS Build: ✓ Working"
echo "  • Android Build: ✓ Working"
echo "  • TypeScript: ✓ No errors"
echo ""
echo "To connect a device:"
echo "  1. Install Expo Go on your device"
echo "  2. Scan the QR code in the terminal"
echo "  3. Or press 'a' for Android or 'i' for iOS simulator"
