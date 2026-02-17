# Login Test Guide

## Backend is Working ✅

I tested the backend login endpoint directly with curl and it works perfectly:

```bash
curl -X POST http://localhost:3000/api/v1/auth/phone-login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9999999999",
    "country_code": "+91",
    "otp": "0000",
    "name": "Test User"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "07c0242f-f2da-4e69-85f8-26add501c32c",
    "phone": "919999999999",
    "name": "Test User",
    "role": "feeder",
    "avatar_url": null,
    "onboarding_completed": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Fix Network Timeout Issue

The timeout happens because your frontend can't reach the backend. 

### Step 1: Update Frontend API URL

I've updated `streetconnectfrontend/.env` to use `localhost:3000` which works for:
- iOS Simulator
- Web browser
- Expo Go on same machine

### Step 2: Choose the Right URL for Your Device

**If testing on:**

1. **iOS Simulator** → Use `http://localhost:3000/api/v1` ✅ (already set)
2. **Android Emulator** → Use `http://10.0.2.2:3000/api/v1`
3. **Physical Device** (iPhone/Android on same WiFi) → Use `http://YOUR_COMPUTER_IP:3000/api/v1`

### Step 3: Restart Expo Dev Server

```bash
cd streetconnectfrontend

# Clear cache and restart
npm start -- --clear
# or
npx expo start -c
```

### Step 4: Test Login

**Use these credentials:**
- **Phone:** `9999999999`
- **Country Code:** `+91`
- **OTP:** `0000` or `000000`
- **Name:** Any name (only needed for first-time signup)

## Quick Network Test

From your terminal, test if the backend is reachable:

```bash
# Test from your machine (should work)
curl http://localhost:3000/health

# Test from your local network IP (for physical devices)
curl http://192.168.1.2:3000/health
```

If the second one fails, your firewall might be blocking it, or the IP changed.

## Troubleshooting

### "Network request failed" or timeout
- **Cause:** Frontend can't reach backend URL
- **Fix:** Use correct IP/URL for your device type (see Step 2)

### "No logs in backend console"
- **Cause:** Request never reaches backend (network issue)
- **Fix:** Verify backend is running (`npm run dev` in backend folder) and URL is correct

### Still not working?
1. Check backend is running on port 3000: `curl http://localhost:3000/health`
2. Check Expo dev server is using the right URL (shows in QR code screen)
3. Make sure backend and device are on same WiFi (for physical devices)
4. Disable firewall temporarily to test

## Backend Status ✅

Your backend is:
- ✅ Running on port 3000
- ✅ Connected to Supabase
- ✅ Connected to Redis
- ✅ Phone login endpoint working
- ✅ Test user exists (phone: 919999999999)

The only issue was the network URL configuration.
