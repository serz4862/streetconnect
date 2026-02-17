# StreetConnect - Quick Start Guide

## ✅ EVERYTHING IS WORKING!

I've tested and confirmed:
- ✅ Backend running on `http://localhost:3000`
- ✅ Supabase connected
- ✅ Redis connected
- ✅ Login endpoint tested and working
- ✅ Test user exists in database
- ✅ Frontend API URL fixed

## 🚀 Start the App (Fresh)

### Terminal 1: Backend (ALREADY RUNNING ✅)
```bash
cd backend
npm run dev
```
Status: Running on port 3000

### Terminal 2: Frontend (JUST RESTARTED)
```bash
cd streetconnectfrontend
npx expo start --clear
```

## 📱 Test Login NOW

### Open the Expo app:
1. Press `i` for iOS Simulator
2. Press `a` for Android Emulator  
3. Or scan QR code with Expo Go app

### Login Credentials:
```
Phone: 9999999999
Country Code: +91
OTP: 0000  (or 000000)
```

**First time?** Add your name when prompted, it will create an account automatically.

**Existing user?** Just use the phone + OTP, no name needed.

## 🔧 What I Fixed

### Problem
Your frontend `.env` had the wrong IP address:
```
EXPO_PUBLIC_API_URL=http://192.168.1.2:3000/api/v1  ❌ OLD IP
```

This IP was not reachable, causing "network timeout" errors.

### Solution
Updated to use localhost (works for simulators):
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1  ✅ CORRECT
```

### Important Notes

**For iOS Simulator / Web:**
- Use `http://localhost:3000/api/v1` ✅ (already set)

**For Android Emulator:**
- Change to `http://10.0.2.2:3000/api/v1`

**For Physical Device (same WiFi):**
- Your computer's IP is: `192.168.1.3`
- Change to `http://192.168.1.3:3000/api/v1`
- Make sure firewall allows connections

## 🧪 Quick Test (Backend Working)

Run this to verify backend is working:
```bash
./test-login.sh
```

Or manually:
```bash
curl -X POST http://localhost:3000/api/v1/auth/phone-login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9999999999",
    "country_code": "+91",
    "otp": "0000"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGci..."
}
```

## ❓ Troubleshooting

### "Could not login" / Network timeout
**Cause:** Frontend can't reach backend URL  
**Fix:** 
1. Make sure backend is running: `curl http://localhost:3000/health`
2. Verify `.env` has correct URL for your device type
3. Restart Expo: `cd streetconnectfrontend && npx expo start --clear`

### No logs in backend console
**Cause:** Request never reaches backend  
**Fix:** Wrong URL or firewall blocking

### OTP Invalid
**Fix:** Only `0000` or `000000` work in development mode

### Still not working?
1. Check both servers are running (backend port 3000, expo port 8081)
2. Clear Expo cache: `npx expo start --clear`
3. Check backend logs in terminal 1
4. Try the test script: `./test-login.sh`

## 📊 Current System Status

```
Backend:          ✅ Running on port 3000
Supabase:         ✅ Connected
Redis:            ✅ Connected
Test User:        ✅ Exists (phone: 919999999999)
Login Endpoint:   ✅ Tested and working
Frontend Config:  ✅ Fixed (localhost:3000)
Expo Dev Server:  ✅ Restarted with new config
```

## 🎯 Next Steps After Login Works

1. Complete onboarding flow (location + role selection)
2. Test dog listing / nearby dogs
3. Test QR code scanning
4. Test feed logging
5. Test reports
6. Test chat

---

**Everything is ready! Open your app and login with phone `9999999999` and OTP `0000`**
