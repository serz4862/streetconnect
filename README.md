# StreetConnect - Dog Welfare & Community Platform

A production-grade mobile application connecting dog lovers, feeders, rescuers, NGOs, vets, and volunteers to track, care for, and protect stray dogs.

## 🎯 Quick Start - APP IS WORKING! ✅

```bash
# Stop any running processes (Ctrl+C in Terminal 1)

# Start the app:
cd /Users/sauravkumar/Desktop/Streetconnect/frontend
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.2 npx expo start --clear

# Then:
# - Scan QR with Expo Go app on your phone (use SDK 54 Expo Go), OR
# - Press 'i' for iOS Simulator

# If you see Watchman "opendir" warnings, run once:
# watchman watch-del '/Users/sauravkumar' ; watchman watch-project '/Users/sauravkumar'
```

**Test Login:** Phone `9876543210`, OTP `0000`

✅ **Backend Running:** http://192.168.1.2:3000  
✅ **Database:** PostgreSQL (run `docker-compose up -d postgres redis` first)  
✅ **Redis:** Cache ready

📖 **See:** [START_HERE.md](START_HERE.md) and [COMPLETE_FIX.md](COMPLETE_FIX.md) for complete details.

```bash
# One-command start with Docker
./run.sh docker

# Then in another terminal, start frontend
cd frontend && npx expo start
```

**See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.**

**See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.**

---

## ✨ Features

### 🔐 Authentication
- Phone-based OTP login (use `0000` for testing)
- Firebase integration (optional, for production)
- Secure JWT token authentication
- Automatic session management

### 🐕 Dog Management
- Register and track stray dogs
- QR code scanning for instant dog profiles
- Photo upload with geolocation
- Health status tracking
- Sterilization records
- Dog history and feed logs
- PDF report generation

### 🗺️ Location Features
- Real-time dog tracking on maps
- Radius-based filtering (1/5/10/20 km)
- Nearby dog discovery
- Location-based reports
- Reverse geocoding

### 🍖 Feed Tracking
- Log feeding activities
- Track quantity and food type
- Automated feed reminders
- Feed history per dog
- Caretaker management

### 📢 Reporting System
- Report lost dogs
- Report found dogs
- Report issues (injured, sick, etc.)
- Photo attachments
- Location tagging
- Status tracking (open, in-progress, resolved)

### 💬 Real-time Chat
- Direct messaging between users
- Pusher WebSocket integration
- Typing indicators
- Read receipts
- Unread message counts
- Conversation management

### 🔔 Notifications
- Feed reminders
- New message alerts
- Report updates
- Dog activity notifications
- Push notifications (configurable)

### 📱 User Roles
**Citizen/Community:**
- Animal Lover, Feeder, Adopter, Foster, Transporter, Volunteer, Reporter

**Rescue & Welfare:**
- Rescuer, Caretaker, Sterilization Coordinator, Inspector

**Professional/Org:**
- Vet, Paravet, NGO, Trainer, Groomer

---

## 🏗️ Architecture

### Frontend Stack
- **Framework:** React Native + Expo SDK 50+
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)
- **State Management:** 
  - Zustand (global state)
  - TanStack Query (server state)
- **Forms:** React Hook Form + Zod validation
- **Maps:** react-native-maps (Google Maps)
- **Camera:** expo-camera (QR scanning)
- **Location:** expo-location
- **Real-time:** Pusher
- **Styling:** StyleSheet API

### Backend Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 14+ with Sequelize ORM
- **Cache:** Redis 6+
- **Storage:** AWS S3
- **Real-time:** Pusher
- **Auth:** Firebase Admin SDK (optional) + JWT
- **PDF:** PDFKit
- **QR:** qrcode library

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Database:** PostgreSQL with PostGIS extensions
- **Cache:** Redis for sessions, geospatial data, and caching
- **Storage:** AWS S3 for images and documents
- **Real-time:** Pusher for WebSocket connections

---

## 📦 Installation

### Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be >= 18
   ```

2. **Docker & Docker Compose** (recommended)
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

4. **iOS Simulator** (macOS) or **Android Emulator**

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Streetconnect
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Setup backend environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your credentials
   npm install
   cd ..
   ```

4. **Setup frontend environment**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit EXPO_PUBLIC_API_URL based on your device
   npm install
   cd ..
   ```

---

## 🚀 Running the Application

### Method 1: With Docker (Recommended)

Start PostgreSQL, Redis, and Backend in Docker:

```bash
./run.sh docker
```

In a new terminal, start the frontend:

```bash
cd frontend
npx expo start
# Press 'i' for iOS or 'a' for Android
```

### Method 2: Without Docker

Requires PostgreSQL and Redis running locally:

```bash
./run.sh
# OR
npm run dev
```

This starts both backend and frontend concurrently.

### Individual Services

**Backend only:**
```bash
cd backend
npm run dev
```

**Frontend only:**
```bash
cd frontend
npx expo start
```

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Test phone login (OTP: 0000)
curl -X POST http://localhost:5000/api/v1/auth/phone-login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "country_code": "+91",
    "otp": "0000",
    "name": "Test User"
  }'
```

### Test Frontend Flow

1. Launch app: `cd frontend && npx expo start`
2. Open on iOS (press `i`) or Android (press `a`)
3. Sign up with any phone number + OTP `0000`
4. Complete onboarding (role selection + location)
5. Explore features: Add Dog, Report Lost/Found, Chat

---

## 📱 App Screens

### Auth Flow
- **Welcome** → Intro screen with Sign Up / Log In
- **Signup** → Name, Phone, Pincode
- **Login** → Phone only
- **Verify OTP** → 6-digit OTP (use `0000` for testing)

### Onboarding Flow
- **Role Selection** → Choose user role
- **Location** → Permission request
- **Set Location** → Manual location search

### Main App
**Tabs:**
- **Home** → Search dogs, filters, quick actions, listings
- **My Dogs** → Your registered dogs + Add Dog card
- **Near Me** → Map view with dog markers + radius filter
- **People** → Chat conversations list

**Stack Screens:**
- **Dog Detail** → Dog info, history, actions, PDF report
- **Add Dog** → Register new dog with photo
- **Scan QR** → Camera QR scanner
- **Reports** → Lost/Found/Issue reporting
- **Profile** → User profile and settings
- **Notifications** → Notification list with read/unread
- **Chat** → Individual conversation

---

## 🗂️ Project Structure

```
Streetconnect/
├── backend/                  # Node.js + Express backend
│   ├── src/
│   │   ├── config/          # Database, Redis, env config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, error, rate limiting
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Firebase, S3, Pusher, PDF, QR
│   │   ├── utils/           # Logger, helpers
│   │   └── server.ts        # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React Native + Expo
│   ├── src/
│   │   ├── app/             # Expo Router screens
│   │   │   ├── (auth)/      # Auth: welcome, signup, login, verify-otp
│   │   │   ├── (onboarding)/ # Onboarding: role, location, set-location
│   │   │   └── (main)/      # Main: tabs + stack screens
│   │   ├── components/      # Reusable UI components
│   │   ├── constants/       # Colors, config, roles
│   │   ├── hooks/           # Custom hooks (useDogs, useChat, etc.)
│   │   ├── services/        # API, Firebase, location, storage
│   │   ├── store/           # Zustand stores (auth, location)
│   │   └── types/           # TypeScript types
│   ├── .env.example
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml       # Docker services
├── package.json             # Root scripts
├── run.sh                   # One-command launcher
├── API_DOCUMENTATION.md     # Complete API reference
├── QUICK_START.md           # Detailed setup guide
└── README.md                # This file
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=streetconnect
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AWS S3 (for image uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket

# Pusher (for real-time chat)
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=ap2

# Firebase (optional)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

### Frontend (`frontend/.env`)

```env
# API URL - adjust based on device:
# iOS Simulator: http://localhost:5000/api/v1
# Android Emulator: http://10.0.2.2:5000/api/v1
# Physical Device: http://YOUR_IP:5000/api/v1
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# Pusher
EXPO_PUBLIC_PUSHER_KEY=your-pusher-key
EXPO_PUBLIC_PUSHER_CLUSTER=ap2
```

---

## 📊 Database Schema

### Main Tables
- **users** → User accounts with roles and location
- **dogs** → Dog profiles with health status
- **feed_logs** → Feeding records
- **dog_caretakers** → Many-to-many relationship
- **reports** → Lost/Found/Issue reports
- **conversations** → Chat conversations
- **messages** → Chat messages
- **notifications** → User notifications

### Indexes & Optimization
- Geospatial indexes for location queries (PostGIS)
- Composite indexes for common query patterns
- Redis caching for hot data
- Connection pooling

---

## 🎯 Performance Features

- **React Query** caching with stale-while-revalidate
- **Redis** caching for users, dogs, and geospatial data
- **Memoized components** with React.memo
- **Optimized FlatLists** with getItemLayout
- **Image optimization** with S3 CDN
- **Lazy loading** for heavy components
- **Database indexes** for fast queries
- **Rate limiting** to prevent abuse

---

## 🔒 Security

- JWT token authentication
- Phone OTP verification
- Rate limiting on auth endpoints
- Input validation with Zod
- SQL injection prevention (Sequelize)
- XSS protection
- CORS configuration
- Secure password handling (for future)

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Complete setup guide with troubleshooting
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Full API reference with examples
- **Backend API** - RESTful API on `http://localhost:5000/api/v1`
- **Health Check** - `http://localhost:5000/health`

---

## 🛠️ Available Scripts

### Root
```bash
npm run dev            # Start backend + frontend concurrently
npm run dev:backend    # Start backend only
npm run dev:frontend   # Start frontend only
npm run dev:docker     # Start Docker services
npm run stop:docker    # Stop Docker services
```

### Backend
```bash
npm run dev           # Development with hot reload
npm run build         # TypeScript build
npm start             # Production start
npm run lint          # ESLint check
```

### Frontend
```bash
npx expo start        # Start Expo dev server
npx expo start -c     # Clear cache and start
npm run lint          # ESLint check
```

---

## 🚢 Deployment

### Backend

**Docker:**
```bash
cd backend
docker build -t streetconnect-backend .
docker run -p 5000:5000 --env-file .env streetconnect-backend
```

**Manual:**
```bash
cd backend
npm run build
npm start
```

### Frontend

**EAS Build:**
```bash
cd frontend
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
```

**Expo Prebuild + Native:**
```bash
cd frontend
npx expo prebuild
# iOS: open ios/StreetConnect.xcworkspace in Xcode
# Android: ./gradlew assembleRelease in android/
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Check Redis is running: `redis-cli ping`
- Verify `.env` configuration
- Check port 5000 is not in use: `lsof -i :5000`

### Frontend can't connect to API
- Verify `EXPO_PUBLIC_API_URL` in `frontend/.env`
- iOS Simulator: use `localhost`
- Android Emulator: use `10.0.2.2`
- Physical Device: use your computer's IP
- Check backend is running: `curl http://localhost:5000/health`

### OTP not working
- Use OTP: `0000` or `000000` for testing
- Phone must be 10 digits
- Country code must be `+91`

### Database connection failed
- Ensure PostgreSQL is running
- Check `DB_HOST`, `DB_PORT`, `DB_NAME` in `.env`
- Create database: `createdb streetconnect`

See [QUICK_START.md](QUICK_START.md) for more troubleshooting steps.

---

## 📝 API Endpoints

### Authentication
- `POST /auth/phone-login` - Login with phone + OTP (0000)
- `POST /auth/login` - Login with Firebase token
- `POST /auth/signup` - Signup with Firebase token
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh JWT token

### Users
- `GET /users/profile` - Get current user
- `PUT /users/profile` - Update profile
- `PUT /users/location` - Update location
- `PUT /users/role` - Update role
- `POST /users/complete-onboarding` - Mark onboarding complete
- `GET /users/:id` - Get user by ID

### Dogs
- `POST /dogs` - Register new dog
- `GET /dogs/:id` - Get dog by ID
- `PUT /dogs/:id` - Update dog
- `GET /dogs/me/list` - Get my dogs
- `GET /dogs/nearby` - Get nearby dogs
- `POST /dogs/scan-qr` - Scan QR code
- `POST /dogs/:id/caretaker` - Add caretaker
- `GET /dogs/:id/report` - Generate PDF report

### Feed Logs
- `POST /feed` - Log feeding
- `GET /feed/dog/:dogId` - Get feed logs for dog
- `GET /feed/history` - Get my feed history
- `POST /feed/reminders` - Send feed reminders

### Reports
- `POST /reports` - Create report (lost/found/issue)
- `GET /reports/:id` - Get report by ID
- `PUT /reports/:id` - Update report
- `GET /reports/nearby` - Get nearby reports
- `GET /reports/me/list` - Get my reports

### Chat
- `POST /chat/conversations` - Start conversation
- `GET /chat/conversations` - Get my conversations
- `GET /chat/conversations/:id/messages` - Get messages
- `POST /chat/conversations/:id/messages` - Send message
- `PUT /chat/messages/:id/read` - Mark message as read

### Notifications
- `GET /notifications` - Get notifications
- `PUT /notifications/:id/read` - Mark as read
- `POST /notifications/read-all` - Mark all as read

### Upload
- `POST /upload/signed-url` - Get S3 signed upload URL

**See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete details with request/response examples.**

---

## 🤝 Contributing

This is a private project. For access, contact the team.

---

## 📄 License

Proprietary - All rights reserved

---

## 👥 Team

Built with ❤️ for dog welfare and community care.

**Powered by Syntra**

---

## 🔗 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Sequelize Documentation](https://sequelize.org)
- [Pusher Documentation](https://pusher.com/docs)
- [Docker Documentation](https://docs.docker.com)

---

**Need Help?** Check [QUICK_START.md](QUICK_START.md) or [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
