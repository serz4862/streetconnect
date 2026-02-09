# StreetConnect - Complete Setup & Run Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Running the Application](#running-the-application)
5. [Testing the Application](#testing-the-application)
6. [Building for Production](#building-for-production)
7. [Troubleshooting](#troubleshooting)
8. [Project Structure](#project-structure)

---

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be >= 18
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **Docker & Docker Compose** (optional, for easy database setup)
   ```bash
   docker --version
   docker-compose --version
   ```

4. **PostgreSQL** (if not using Docker)
   - Version 14 or higher
   - Install from https://www.postgresql.org/download/

5. **Redis** (if not using Docker)
   - Version 6 or higher
   - macOS: `brew install redis`
   - Linux: `sudo apt install redis-server`

6. **Expo CLI** (for mobile development)
   ```bash
   npm install -g expo-cli
   ```

7. **iOS Simulator** (macOS only) or **Android Emulator**
   - Xcode for iOS (macOS): https://developer.apple.com/xcode/
   - Android Studio for Android: https://developer.android.com/studio

---

## Quick Start

### Method 1: Using Docker (Recommended)

This method starts PostgreSQL, Redis, and the backend in Docker containers.

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Streetconnect

# 2. Install root dependencies
npm install

# 3. Setup backend environment
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for Docker)
cd ..

# 4. Setup frontend environment
cd frontend
cp .env.example .env
# Make sure EXPO_PUBLIC_API_URL points to your backend
# For iOS simulator: http://localhost:5000/api/v1
# For Android emulator: http://10.0.2.2:5000/api/v1
# For physical device: http://YOUR_COMPUTER_IP:5000/api/v1
cd ..

# 5. Start Docker services (PostgreSQL + Redis + Backend)
./run.sh docker

# 6. In a NEW terminal, start frontend
cd frontend
npm install
npx expo start
# Press 'i' for iOS or 'a' for Android
```

### Method 2: Without Docker

This method requires PostgreSQL and Redis to be running locally.

```bash
# 1. Clone and setup (same as above)
git clone <your-repo-url>
cd Streetconnect
npm install

# 2. Setup databases
# Start PostgreSQL and create database:
createdb streetconnect

# Start Redis:
redis-server

# 3. Setup environment files (same as Method 1)
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env

# 4. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 5. Start everything (from root)
cd ..
./run.sh
# OR
npm run dev

# This starts both backend and frontend together
```

---

## Detailed Setup

### 1. Environment Configuration

#### Backend Environment (`backend/.env`)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=5000

# Database (adjust if not using Docker)
DB_HOST=localhost          # Use 'localhost' for local, 'postgres' for Docker
DB_PORT=5432
DB_NAME=streetconnect
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (adjust if not using Docker)
REDIS_HOST=localhost       # Use 'localhost' for local, 'redis' for Docker
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# AWS S3 (required for image uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET=streetconnect-uploads

# Pusher (required for real-time chat)
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=ap2

# Firebase (optional, for production phone auth)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

**Note:** For development/testing:
- JWT_SECRET can be any random string
- AWS S3 is optional (image uploads won't work without it)
- Pusher is optional (real-time chat won't work without it)
- Firebase is optional (use phone-login with OTP 0000 for testing)

#### Frontend Environment (`frontend/.env`)

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
# API URL - IMPORTANT: Adjust based on your device
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# Pusher (must match backend)
EXPO_PUBLIC_PUSHER_KEY=your-pusher-key
EXPO_PUBLIC_PUSHER_CLUSTER=ap2
```

**API URL Configuration:**

| Device/Emulator | URL |
|----------------|-----|
| iOS Simulator | `http://localhost:5000/api/v1` |
| Android Emulator | `http://10.0.2.2:5000/api/v1` |
| Physical Device (same WiFi) | `http://YOUR_COMPUTER_IP:5000/api/v1` |

To find your computer's IP:
- macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Linux: `ip addr show | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig` (look for IPv4 Address)

### 2. Install Dependencies

```bash
# Root dependencies (for concurrently)
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup

#### Option A: Using Docker (Automatic)

When you run `./run.sh docker`, the database is created automatically.

#### Option B: Manual Setup

```bash
# Start PostgreSQL
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
createdb streetconnect

# Start Redis
redis-server
```

The backend will automatically create tables on first run.

---

## Running the Application

### Complete Application (All Services)

#### Option 1: Docker + Frontend

```bash
# Terminal 1: Start Docker services
./run.sh docker

# Terminal 2: Start frontend
cd frontend
npx expo start
# Press 'i' for iOS or 'a' for Android
```

#### Option 2: All services without Docker

```bash
# Make sure PostgreSQL and Redis are running
./run.sh
# OR
npm run dev
```

### Individual Services

#### Backend Only

```bash
cd backend
npm run dev
```

Backend will start on http://localhost:5000

Health check: http://localhost:5000/health

#### Frontend Only

```bash
cd frontend
npx expo start
```

Options:
- Press `i` - Open iOS simulator
- Press `a` - Open Android emulator
- Press `w` - Open in web browser
- Scan QR code with Expo Go app on physical device

---

## Testing the Application

### 1. Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Phone login (OTP 0000 for testing)
curl -X POST http://localhost:5000/api/v1/auth/phone-login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "country_code": "+91",
    "otp": "0000",
    "name": "Test User",
    "pincode": "110001"
  }'

# Response will include:
# { "user": {...}, "token": "eyJhbGc..." }

# Use the token for authenticated requests:
curl http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Test Frontend

1. **Launch the app:**
   ```bash
   cd frontend
   npx expo start
   ```

2. **Test authentication flow:**
   - Open app → Welcome screen
   - Tap "Sign Up"
   - Enter: Name, Phone (any 10 digits), Pincode
   - Tap "Get OTP"
   - Enter OTP: `0000` (four zeros)
   - Tap "Create Account"

3. **Test onboarding:**
   - Select a role (e.g., "Feeder")
   - Tap "Continue"
   - Location screen → "Use My Location" or "Enter Location Manually"
   - Complete onboarding

4. **Test main features:**
   - **Home Tab:** View nearby dogs, search, filters
   - **My Dogs Tab:** View your dogs, tap "Add Dog" card
   - **Near Me Tab:** Map view with dog markers
   - **People Tab:** View conversations (empty initially)

### 3. Test Complete Flow

**Scenario: Register a new dog**

1. Login with phone + OTP 0000
2. Complete onboarding
3. Go to "My Dogs" tab
4. Tap "Add Dog" card
5. Fill form:
   - Name: "Bruno"
   - Color: "Brown"
   - Gender: Male
   - Sterilized: Yes
   - Age: 3
   - Optional: Upload photo (requires AWS S3)
6. Tap "Save Dog"
7. View dog details

**Scenario: Report a lost dog**

1. From Home tab, tap "Report Lost"
2. Fill form:
   - Optional: Select dog or leave blank
   - Add photo
   - Title: "Lost dog near Park"
   - Description: "Brown dog, red collar"
   - Last seen: "2 hours ago"
3. Tap "Submit Report"

---

## Building for Production

### Backend

#### Using Docker

```bash
cd backend
docker build -t streetconnect-backend .
docker run -p 5000:5000 --env-file .env streetconnect-backend
```

#### Manual Build

```bash
cd backend
npm run build
npm start
```

### Frontend

#### Development Build (Expo Go)

Already running with `npx expo start`

#### Production Build (Standalone Apps)

##### Prerequisites

1. **Create Expo account:**
   ```bash
   npx expo login
   ```

2. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

3. **Configure EAS:**
   ```bash
   cd frontend
   eas build:configure
   ```

##### Build for iOS

```bash
cd frontend
eas build --platform ios
```

Options:
- `--profile preview` - For internal testing
- `--profile production` - For App Store

##### Build for Android

```bash
cd frontend
eas build --platform android
```

Options:
- `--profile preview` - APK for testing
- `--profile production` - AAB for Play Store

##### Build for Both

```bash
cd frontend
eas build --platform all
```

#### Alternative: Expo Prebuild + Native Build

```bash
cd frontend
npx expo prebuild

# iOS (macOS only)
cd ios
pod install
open StreetConnect.xcworkspace
# Build in Xcode

# Android
cd android
./gradlew assembleRelease
# APK in: android/app/build/outputs/apk/release/
```

---

## Troubleshooting

### Backend Issues

#### Port 5000 already in use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in backend/.env
PORT=3000
```

#### Database connection failed

```bash
# Check PostgreSQL is running
pg_isready

# Check connection details in .env
# If using Docker, DB_HOST should be 'localhost' (when backend runs on host) or 'postgres' (when backend runs in Docker)

# Create database if missing
createdb streetconnect
```

#### Redis connection failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
# macOS: brew services start redis
# Linux: sudo systemctl start redis
```

### Frontend Issues

#### API requests failing

1. **Check API URL in `frontend/.env`:**
   - iOS Simulator: `http://localhost:5000/api/v1`
   - Android Emulator: `http://10.0.2.2:5000/api/v1`
   - Physical Device: `http://YOUR_IP:5000/api/v1`

2. **Test backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Check firewall:**
   - Physical devices need backend port open
   - macOS: System Preferences → Security → Firewall

#### Metro bundler issues

```bash
cd frontend
# Clear cache
npx expo start -c

# Or delete cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

#### iOS Simulator not starting

```bash
# List simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15"

# Or in Expo:
npx expo start
# Press Shift+I to select simulator
```

#### Android Emulator issues

```bash
# List AVDs
emulator -list-avds

# Start specific AVD
emulator -avd Pixel_5_API_33

# Or in Expo:
npx expo start
# Press Shift+A to select emulator
```

### Docker Issues

#### Containers not starting

```bash
# Check Docker is running
docker ps

# View logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d
```

#### Database not initializing

```bash
# Remove volumes and restart
docker-compose down -v
docker-compose up -d

# Check logs
docker-compose logs postgres
```

#### Port conflicts

Edit `docker-compose.yml` to change ports:
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Change 5432 to 5433
```

### Common Errors

#### "OTP verification failed"

- Use OTP: `0000` or `000000` for testing
- Check phone number is 10 digits
- Country code should be `+91`

#### "Image upload failed"

- AWS S3 credentials must be configured in `backend/.env`
- S3 bucket must exist and have correct permissions

#### "Real-time chat not working"

- Pusher credentials must be configured
- Check `PUSHER_KEY` matches in backend and frontend
- Check cluster setting (e.g., `ap2`, `us2`)

---

## Project Structure

```
Streetconnect/
├── backend/                  # Node.js + Express backend
│   ├── src/
│   │   ├── config/          # Database, Redis, environment config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, error handling, rate limiting
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Firebase, S3, Pusher, PDF, QR
│   │   ├── utils/           # Logger and utilities
│   │   └── server.ts        # Express app entry point
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React Native + Expo frontend
│   ├── src/
│   │   ├── app/             # Expo Router screens
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── (auth)/      # Auth flow: welcome, signup, login, verify-otp
│   │   │   ├── (onboarding)/ # Onboarding: role, location, set-location
│   │   │   └── (main)/      # Main app: tabs + stack screens
│   │   │       ├── (tabs)/  # Home, My Dogs, Near Me, People
│   │   │       ├── dog/[id].tsx
│   │   │       ├── add-dog.tsx
│   │   │       ├── scan-qr.tsx
│   │   │       ├── report/  # lost, found, issue
│   │   │       ├── profile.tsx
│   │   │       ├── notifications.tsx
│   │   │       └── chat/[id].tsx
│   │   ├── components/      # Reusable components
│   │   ├── constants/       # Colors, config, roles
│   │   ├── hooks/           # Custom hooks (useDogs, useChat, etc.)
│   │   ├── services/        # API client, Firebase, location, storage
│   │   ├── store/           # Zustand stores (auth, location)
│   │   └── types/           # TypeScript types
│   ├── .env.example
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml       # Docker services (Postgres, Redis, Backend)
├── package.json             # Root package with dev scripts
├── run.sh                   # One-command launcher
├── API_DOCUMENTATION.md     # Full API reference
├── QUICK_START.md           # This file
└── README.md                # Project overview
```

---

## Useful Commands

### Development

```bash
# Start everything (Docker)
./run.sh docker

# Start everything (local)
./run.sh

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npx expo start

# View Docker logs
docker-compose logs -f

# Stop Docker services
docker-compose down
```

### Database

```bash
# Access PostgreSQL (Docker)
docker-compose exec postgres psql -U postgres -d streetconnect

# Access PostgreSQL (local)
psql -U postgres -d streetconnect

# Backup database
pg_dump -U postgres streetconnect > backup.sql

# Restore database
psql -U postgres streetconnect < backup.sql
```

### Testing

```bash
# Backend tests (if implemented)
cd backend && npm test

# Frontend tests (if implemented)
cd frontend && npm test

# Lint
cd backend && npm run lint
cd frontend && npm run lint

# Type check
cd backend && npm run build
cd frontend && npx tsc --noEmit
```

---

## Next Steps

1. **Test the complete flow:**
   - Signup → Onboarding → Add Dog → Report → Chat

2. **Configure production services:**
   - AWS S3 for image uploads
   - Pusher for real-time chat
   - Firebase for production phone auth (optional)

3. **Deploy backend:**
   - Use Docker on AWS ECS, Google Cloud Run, or DigitalOcean
   - Set up PostgreSQL and Redis instances
   - Configure environment variables

4. **Build mobile apps:**
   - Use EAS Build for iOS and Android
   - Submit to App Store and Play Store

5. **Monitor and maintain:**
   - Check logs for errors
   - Monitor API performance
   - Collect user feedback

---

## Support & Resources

- **API Documentation:** See `API_DOCUMENTATION.md`
- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev
- **Sequelize Docs:** https://sequelize.org
- **Docker Docs:** https://docs.docker.com

---

**Happy Coding! 🐕**

If you encounter any issues not covered here, check the logs:
- Backend: `docker-compose logs backend`
- Frontend: Metro bundler terminal output
- Database: `docker-compose logs postgres`
