# StreetConnect - Complete Setup & Run Guide

## ✅ All Errors Fixed

### What Was Fixed

1. **PostgreSQL Connection** - Uses Docker Postgres on port **5433** (not conflicting with local Postgres on 5432)
2. **Backend TurboModule Error** - Frontend upgraded to **Expo SDK 54** with all compatible packages
3. **Docker Build** - Multi-stage Dockerfile now builds TypeScript correctly
4. **Frontend Dependencies** - Removed `react-native-fast-image` (incompatible with React 19)
5. **Port Conflicts** - Backend and frontend can now run simultaneously

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start PostgreSQL (Docker)

```bash
cd /Users/sauravkumar/Desktop/Streetconnect
docker-compose up -d postgres
```

**Verify Postgres is running:**
```bash
docker ps | grep postgres
```

You should see: `streetconnect_postgres` on port `0.0.0.0:5433->5432/tcp`

---

### Step 2: Start Backend (Local)

Open a new terminal:

```bash
cd /Users/sauravkumar/Desktop/Streetconnect/backend
npm run dev
```

**Expected output:**
```
✅ Redis client connected
✅ Database connection established successfully
✅ Database synchronized
🚀 Server is running on port 3000
```

Backend will be at: **http://localhost:3000**

---

### Step 3: Start Frontend (Expo)

Open another terminal:

```bash
cd /Users/sauravkumar/Desktop/Streetconnect/frontend
npm run start:clear
```

Or with tunnel (recommended for physical device):
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.2 npx expo start --clear
```

**Then:**
- Scan QR code with **Expo Go (SDK 54)** on your phone
- OR press `i` for iOS Simulator
- OR press `a` for Android Emulator

---

## 🔧 Configuration Summary

### Backend (Port 3000)
- **PostgreSQL**: `localhost:5433` (Docker)
- **Redis**: `localhost:6379` (local or Docker)
- **Database**: `streetconnect_db`
- **User**: `streetconnect`
- **Password**: `streetconnect_secure_password`

### Frontend (Expo)
- **Expo SDK**: 54
- **React**: 19.1.0
- **React Native**: 0.81.5
- **API URL**: `http://192.168.1.2:3000/api/v1` (set in `frontend/.env`)

---

## 📝 Test Credentials

- **Phone**: `9876543210`
- **OTP**: `0000` (test mode)

---

## 🐛 Troubleshooting

### If Backend Shows "EADDRINUSE: port 3000"
Something is using port 3000. Kill it:
```bash
lsof -i :3000 | grep LISTEN
kill -9 <PID>
```

### If Frontend Shows TurboModule/PlatformConstants Error
Your Expo Go app needs to be SDK 54:
```bash
# Update Expo Go from App Store / Play Store
# Then clear cache and restart:
cd frontend
npx expo start --clear
```

### If Postgres Connection Fails
Check Docker container:
```bash
docker ps | grep postgres
docker logs streetconnect_postgres
```

Restart if needed:
```bash
docker-compose restart postgres
```

### If Watchman Shows Warnings
Run once:
```bash
watchman watch-del '/Users/sauravkumar'
watchman watch-project '/Users/sauravkumar'
```

---

## 🛠 Useful Commands

### Backend
```bash
# Dev mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

### Frontend
```bash
# Start with tunnel (for physical device)
npm start

# Start with cleared cache
npm run start:clear

# Type check
npm run type-check
```

### Docker
```bash
# Start only Postgres
docker-compose up -d postgres

# Stop all containers
docker-compose down

# View logs
docker logs streetconnect_postgres -f

# Rebuild backend image
docker-compose build backend
```

---

## 📂 Project Structure

```
Streetconnect/
├── backend/               # Node.js + Express + PostgreSQL
│   ├── .env              # DB config (port 5433)
│   ├── src/
│   │   ├── server.ts     # Main entry point
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── routes/
│   └── Dockerfile        # Multi-stage build
├── frontend/             # React Native + Expo SDK 54
│   ├── .env              # API_URL config
│   ├── src/
│   │   ├── app/          # Expo Router pages
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── package.json      # No react-native-fast-image
└── docker-compose.yml    # Postgres on 5433, Redis on 6379
```

---

## ✅ Current Status

- ✅ PostgreSQL: Running on port 5433 (Docker)
- ✅ Redis: Running on port 6379 (local)
- ✅ Backend: Ready to start on port 3000
- ✅ Frontend: Dependencies installed, SDK 54 compatible
- ✅ Docker: Backend image builds successfully
- ✅ Expo Go: Compatible with SDK 54

---

## 🎯 Next Steps

1. Run the 3 commands above (Postgres, Backend, Frontend)
2. Open Expo Go on your phone (update to SDK 54 if needed)
3. Scan QR code
4. Login with phone `9876543210` and OTP `0000`
5. Start using the app!

---

## 📞 Support

If you see any errors:
1. Check this guide's Troubleshooting section
2. Check Docker logs: `docker logs streetconnect_postgres`
3. Check backend logs in the terminal
4. Ensure Expo Go is SDK 54

Everything is configured and ready to run! 🎉
