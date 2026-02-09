# 🚨 FIX FOR "COULD NOT CONNECT TO SERVER" ERROR

## ✅ SOLUTION: Use Expo Tunnel

I've updated the frontend to use **Expo's tunnel mode**, which works through Expo's servers and doesn't require network configuration!

---

## 📱 HOW TO USE:

### Step 1: Stop Current Expo (if running)

In Terminal 1 (where `npm start` is running):
- Press **Ctrl+C** to stop

### Step 2: Restart with Tunnel Mode

```bash
cd /Users/sauravkumar/Desktop/Streetconnect/frontend
npm start
```

Wait for it to say: **"Tunnel ready"** (takes 10-20 seconds)

### Step 3: Scan QR Code

The QR code will now show a URL like: `exp://XX-XXX.XXX.exp.direct:80`

This tunnel URL works from anywhere - even if you're on a different WiFi network!

---

## 🎯 BACKEND STATUS:

Backend is running in the background on port 3000.

**Check if it's ready:**
```bash
curl http://localhost:3000/health
```

If you get a response, backend is ready! If not, wait 30-60 seconds (TypeScript is compiling).

---

## ⚡ ALTERNATIVE: iOS Simulator (FASTEST!)

If tunnel is slow or you want instant testing:

**Just press `i` in your terminal!**

iOS Simulator:
- ✅ No network issues
- ✅ Works instantly
- ✅ Full dev tools
- ✅ Recommended for development

---

## 🐛 IF TUNNEL FAILS:

### Option 1: Use LAN Mode (if on same WiFi)
```bash
cd frontend
expo start --lan
```

Then make sure:
1. Your phone is on the same WiFi as your computer
2. Your computer's firewall allows connections on port 8081

### Option 2: Check Firewall
```bash
# Temporarily disable firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Test, then turn back on:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

### Option 3: Use iOS Simulator
Press `i` - Works every time!

---

## 📊 WHAT CHANGED:

| Before | After |
|--------|-------|
| `expo start` (localhost only) | `expo start --tunnel` (works anywhere) |
| QR: `exp://127.0.0.1:8081` | QR: `exp://XX.exp.direct:80` |
| ❌ Phone can't connect | ✅ Phone connects through tunnel |

---

## ✨ NEXT STEPS:

1. **Press Ctrl+C** in your terminal (stop current Expo)
2. **Run `npm start`** again (will use tunnel mode now)
3. **Wait for "Tunnel ready"** message
4. **Scan QR code** with Expo Go
5. **Login with OTP: 0000**

---

**TUNNEL MODE FIXES NETWORK ISSUES! 🎉**

Just restart Expo and it will work!
