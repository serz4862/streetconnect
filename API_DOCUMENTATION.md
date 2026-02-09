# StreetConnect API Documentation

## Table of Contents
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Users](#users)
- [Dogs](#dogs)
- [Feed Logs](#feed-logs)
- [Reports](#reports)
- [Chat & Messages](#chat--messages)
- [Notifications](#notifications)
- [Upload](#upload)

---

## Getting Started

### Base URL
- Development: `http://localhost:5000/api/v1`
- Production: `https://your-domain.com/api/v1`

### Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "data": {...},
  "error": "error message if failed"
}
```

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes per IP
- General endpoints: 100 requests per 15 minutes per IP

---

## Authentication

### 1. Phone Login (OTP 0000) - **Recommended for Testing**

**Endpoint:** `POST /auth/phone-login`

**Description:** Login or signup using phone number with OTP. Use OTP `0000` or `000000` for testing.

**Request Body:**
```json
{
  "phone": "9876543210",
  "country_code": "+91",
  "otp": "0000",
  "name": "John Doe",  // Required only for signup (new users)
  "pincode": "110001"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "9876543210",
    "country_code": "+91",
    "role": "animal_lover",
    "onboarding_completed": false,
    "is_active": true,
    "avatar_url": null,
    "city": null,
    "pincode": "110001",
    "latitude": null,
    "longitude": null,
    "created_at": "2026-02-03T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Status Codes:**
- `200 OK` - Login successful
- `201 Created` - New user created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Invalid OTP
- `404 Not Found` - User not found (login without name)

---

### 2. Login (Firebase Token)

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "phone": "9876543210",
  "firebase_token": "firebase_id_token_here"
}
```

**Response:** Same as phone-login

---

### 3. Signup (Firebase Token)

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "phone": "9876543210",
  "country_code": "+91",
  "name": "John Doe",
  "firebase_token": "firebase_id_token_here",
  "city": "New Delhi",
  "pincode": "110001",
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Response:** Same as phone-login

---

### 4. Logout

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### 5. Refresh Token

**Endpoint:** `POST /auth/refresh`

**Headers:** `Authorization: Bearer <old_token>`

**Response:**
```json
{
  "token": "new_jwt_token_here"
}
```

---

## Users

### 1. Get Current User Profile

**Endpoint:** `GET /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "9876543210",
    "country_code": "+91",
    "role": "feeder",
    "avatar_url": "https://s3.../avatar.jpg",
    "city": "New Delhi",
    "pincode": "110001",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "onboarding_completed": true,
    "is_active": true,
    "created_at": "2026-02-03T10:00:00.000Z"
  }
}
```

---

### 2. Update Profile

**Endpoint:** `PUT /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "avatar_url": "https://s3.../new-avatar.jpg",
  "city": "Mumbai",
  "pincode": "400001"
}
```

**Response:** Same as Get Profile

---

### 3. Update Location

**Endpoint:** `PUT /users/location`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "latitude": 19.0760,
  "longitude": 72.8777
}
```

**Response:**
```json
{
  "message": "Location updated successfully",
  "user": {...}
}
```

---

### 4. Update Role

**Endpoint:** `PUT /users/role`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "role": "rescuer"
}
```

**Valid Roles:**
- `animal_lover`, `feeder`, `adopter`, `foster`, `transporter`, `volunteer`, `reporter`
- `rescuer`, `caretaker`, `sterilization_coordinator`, `inspector`
- `vet`, `paravet`, `ngo`, `trainer`, `groomer`

**Response:**
```json
{
  "message": "Role updated successfully",
  "user": {...}
}
```

---

### 5. Complete Onboarding

**Endpoint:** `POST /users/complete-onboarding`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Onboarding completed successfully",
  "user": {...}
}
```

---

### 6. Get User by ID

**Endpoint:** `GET /users/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatar_url": "...",
    "role": "vet",
    "city": "New Delhi",
    "created_at": "..."
  }
}
```

---

## Dogs

### 1. Create Dog

**Endpoint:** `POST /dogs`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Bruno",
  "color": "brown",
  "gender": "male",
  "is_sterilized": true,
  "age_approx": 3,
  "health_status": "healthy",
  "health_notes": "Friendly and active",
  "photo_url": "https://s3.../dog-photo.jpg",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "qr_code": "QR123456"
}
```

**Response:**
```json
{
  "message": "Dog registered successfully",
  "dog": {
    "id": "uuid",
    "name": "Bruno",
    "color": "brown",
    "gender": "male",
    "is_sterilized": true,
    "age_approx": 3,
    "health_status": "healthy",
    "health_notes": "Friendly and active",
    "photo_url": "...",
    "qr_code": "QR123456",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "last_seen_at": "2026-02-03T10:00:00.000Z",
    "creator_id": "uuid",
    "created_at": "2026-02-03T10:00:00.000Z"
  }
}
```

---

### 2. Get Dog by ID

**Endpoint:** `GET /dogs/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "dog": {
    "id": "uuid",
    "name": "Bruno",
    "color": "brown",
    "gender": "male",
    "is_sterilized": true,
    "age_approx": 3,
    "health_status": "healthy",
    "photo_url": "...",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "last_seen_at": "...",
    "creator": {
      "id": "uuid",
      "name": "John Doe",
      "avatar_url": "..."
    }
  }
}
```

---

### 3. Update Dog

**Endpoint:** `PUT /dogs/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (All fields optional)
```json
{
  "name": "Bruno Updated",
  "color": "dark brown",
  "health_status": "sick",
  "health_notes": "Needs vet attention",
  "latitude": 28.6200,
  "longitude": 77.2100
}
```

**Response:**
```json
{
  "message": "Dog updated successfully",
  "dog": {...}
}
```

---

### 4. Get My Dogs

**Endpoint:** `GET /dogs/me/list`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "dogs": [
    {
      "id": "uuid",
      "name": "Bruno",
      "photo_url": "...",
      "gender": "male",
      "is_sterilized": true,
      "last_seen_at": "...",
      "latitude": 28.6139,
      "longitude": 77.2090
    }
  ],
  "total": 5
}
```

---

### 5. Get Nearby Dogs

**Endpoint:** `GET /dogs/nearby`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `latitude` (required): e.g., `28.6139`
- `longitude` (required): e.g., `77.2090`
- `radius` (optional, default 5): radius in km (1, 5, 10, 20)
- `gender` (optional): `male`, `female`, `unknown`
- `color` (optional): color name
- `is_sterilized` (optional): `true` or `false`

**Example:** `GET /dogs/nearby?latitude=28.6139&longitude=77.2090&radius=10&gender=male`

**Response:**
```json
{
  "dogs": [
    {
      "id": "uuid",
      "name": "Bruno",
      "photo_url": "...",
      "gender": "male",
      "color": "brown",
      "is_sterilized": true,
      "latitude": 28.6150,
      "longitude": 77.2095,
      "last_seen_at": "...",
      "creator": {
        "id": "uuid",
        "name": "John Doe"
      }
    }
  ],
  "total": 15
}
```

---

### 6. Scan QR Code

**Endpoint:** `POST /dogs/scan-qr`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "qr_data": "QR123456"
}
```

**Response (Dog Found):**
```json
{
  "message": "Dog found",
  "dog": {...}
}
```

**Response (Not Registered):**
```json
{
  "error": "Invalid QR code",
  "status": 400
}
```

---

### 7. Add Caretaker

**Endpoint:** `POST /dogs/:id/caretaker`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "caretaker_type": "primary"
}
```

**Caretaker Types:** `primary`, `secondary`, `foster`, `temporary`

**Response:**
```json
{
  "message": "Caretaker added successfully",
  "caretaker": {
    "id": "uuid",
    "dog_id": "uuid",
    "user_id": "uuid",
    "caretaker_type": "primary",
    "is_active": true,
    "created_at": "..."
  }
}
```

---

### 8. Get Dog Report (PDF)

**Endpoint:** `GET /dogs/:id/report`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "report_url": "https://s3.../dog-report-uuid.pdf"
}
```

---

## Feed Logs

### 1. Log Feed

**Endpoint:** `POST /feed`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "dog_id": "uuid",
  "quantity_kg": 2.5,
  "food_type": "kibble",
  "notes": "Fed in the morning",
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Response:**
```json
{
  "message": "Feed logged successfully",
  "feed_log": {
    "id": "uuid",
    "dog_id": "uuid",
    "feeder_id": "uuid",
    "quantity_kg": 2.5,
    "food_type": "kibble",
    "notes": "Fed in the morning",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "created_at": "2026-02-03T10:00:00.000Z"
  }
}
```

---

### 2. Get Feed Logs for Dog

**Endpoint:** `GET /feed/dog/:dogId`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional, default 50): number of logs
- `offset` (optional, default 0): for pagination

**Example:** `GET /feed/dog/uuid?limit=10&offset=0`

**Response:**
```json
{
  "feed_logs": [
    {
      "id": "uuid",
      "dog_id": "uuid",
      "quantity_kg": 2.5,
      "food_type": "kibble",
      "notes": "...",
      "created_at": "...",
      "feeder": {
        "id": "uuid",
        "name": "John Doe",
        "avatar_url": "..."
      }
    }
  ],
  "total": 100
}
```

---

### 3. Get My Feed History

**Endpoint:** `GET /feed/history`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:** Same as above

**Response:** Same structure as Get Feed Logs for Dog

---

### 4. Send Feed Reminders

**Endpoint:** `POST /feed/reminders`

**Headers:** `Authorization: Bearer <token>`

**Description:** Manually trigger feed reminders for dogs not fed in 24 hours (normally runs via cron)

**Response:**
```json
{
  "message": "Reminders sent",
  "count": 5
}
```

---

## Reports

### 1. Create Report

**Endpoint:** `POST /reports`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "dog_id": "uuid",  // Optional
  "type": "lost",
  "title": "Lost dog near Park Street",
  "description": "Brown dog, wearing red collar, last seen near Park Street gate",
  "photo_url": "https://s3.../report-photo.jpg",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "status": "open"
}
```

**Report Types:** `lost`, `found`, `issue`

**Report Statuses:** `open`, `in_progress`, `resolved`, `closed`

**Response:**
```json
{
  "message": "Report created successfully",
  "report": {
    "id": "uuid",
    "dog_id": "uuid",
    "reporter_id": "uuid",
    "type": "lost",
    "title": "Lost dog near Park Street",
    "description": "...",
    "photo_url": "...",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "status": "open",
    "created_at": "2026-02-03T10:00:00.000Z"
  }
}
```

---

### 2. Get Report by ID

**Endpoint:** `GET /reports/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "report": {
    "id": "uuid",
    "type": "lost",
    "title": "...",
    "description": "...",
    "photo_url": "...",
    "status": "open",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "created_at": "...",
    "reporter": {
      "id": "uuid",
      "name": "Jane Doe",
      "avatar_url": "..."
    },
    "dog": {
      "id": "uuid",
      "name": "Bruno",
      "photo_url": "..."
    }
  }
}
```

---

### 3. Update Report

**Endpoint:** `PUT /reports/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "resolved",
  "description": "Dog has been found!"
}
```

**Response:**
```json
{
  "message": "Report updated successfully",
  "report": {...}
}
```

---

### 4. Get Nearby Reports

**Endpoint:** `GET /reports/nearby`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `latitude` (required)
- `longitude` (required)
- `radius` (optional, default 5): in km
- `type` (optional): `lost`, `found`, `issue`
- `status` (optional): `open`, `in_progress`, `resolved`, `closed`

**Example:** `GET /reports/nearby?latitude=28.6139&longitude=77.2090&radius=10&type=lost&status=open`

**Response:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "type": "lost",
      "title": "...",
      "status": "open",
      "photo_url": "...",
      "latitude": 28.6150,
      "longitude": 77.2095,
      "created_at": "...",
      "reporter": {
        "id": "uuid",
        "name": "Jane Doe"
      }
    }
  ],
  "total": 8
}
```

---

### 5. Get My Reports

**Endpoint:** `GET /reports/me/list`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type` (optional)
- `status` (optional)
- `limit` (optional, default 50)
- `offset` (optional, default 0)

**Response:** Same structure as nearby reports

---

## Chat & Messages

### 1. Start Conversation

**Endpoint:** `POST /chat/conversations`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "other_user_id": "uuid"
}
```

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "user1_id": "uuid",
    "user2_id": "uuid",
    "last_message": null,
    "last_message_at": null,
    "created_at": "2026-02-03T10:00:00.000Z"
  }
}
```

---

### 2. Get My Conversations

**Endpoint:** `GET /chat/conversations`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "user1_id": "uuid",
      "user2_id": "uuid",
      "last_message": "Hey, how are you?",
      "last_message_at": "2026-02-03T12:30:00.000Z",
      "created_at": "...",
      "other_user": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatar_url": "..."
      },
      "unread_count": 3
    }
  ],
  "total": 10
}
```

---

### 3. Get Messages

**Endpoint:** `GET /chat/conversations/:conversationId/messages`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional, default 50)
- `offset` (optional, default 0)

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "uuid",
      "content": "Hey, how are you?",
      "is_read": false,
      "created_at": "2026-02-03T12:30:00.000Z",
      "sender": {
        "id": "uuid",
        "name": "Jane Doe",
        "avatar_url": "..."
      }
    }
  ],
  "total": 50
}
```

---

### 4. Send Message

**Endpoint:** `POST /chat/conversations/:conversationId/messages`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "receiver_id": "uuid",
  "content": "Hello! I saw your report about the lost dog."
}
```

**Response:**
```json
{
  "message": {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "content": "Hello! I saw your report about the lost dog.",
    "is_read": false,
    "created_at": "2026-02-03T12:31:00.000Z"
  }
}
```

---

### 5. Mark Message as Read

**Endpoint:** `PUT /chat/messages/:messageId/read`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Message marked as read",
  "message": {...}
}
```

---

## Notifications

### 1. Get My Notifications

**Endpoint:** `GET /notifications`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `is_read` (optional): `true` or `false`
- `limit` (optional, default 50)
- `offset` (optional, default 0)

**Example:** `GET /notifications?is_read=false&limit=20`

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "feed_reminder",
      "title": "Time to feed Bruno!",
      "message": "Bruno hasn't been fed in the last 24 hours.",
      "data": {
        "dog_id": "uuid",
        "dog_name": "Bruno"
      },
      "is_read": false,
      "created_at": "2026-02-03T10:00:00.000Z"
    }
  ],
  "total": 15,
  "unread_count": 5
}
```

**Notification Types:**
- `feed_reminder`
- `new_message`
- `report_update`
- `dog_update`

---

### 2. Mark as Read

**Endpoint:** `PUT /notifications/:id/read`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Notification marked as read",
  "notification": {...}
}
```

---

### 3. Mark All as Read

**Endpoint:** `POST /notifications/read-all`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

---

## Upload

### 1. Get Signed Upload URL

**Endpoint:** `POST /upload/signed-url`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "file_name": "dog-photo.jpg",
  "file_type": "image/jpeg",
  "folder": "dogs"
}
```

**Valid Folders:** `dogs`, `reports`, `avatars`, `general`

**Response:**
```json
{
  "upload_url": "https://s3.amazonaws.com/bucket/...",
  "file_url": "https://s3.amazonaws.com/bucket/dogs/uuid-dog-photo.jpg",
  "key": "dogs/uuid-dog-photo.jpg"
}
```

**How to Use:**
1. Call this endpoint to get signed URL
2. Upload file directly to S3 using `upload_url` with PUT request
3. Use `file_url` in your create/update requests

**Example Upload (after getting signed URL):**
```javascript
const response = await fetch(upload_url, {
  method: 'PUT',
  headers: {
    'Content-Type': file_type,
  },
  body: fileBlob
});
```

---

## Error Codes

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not allowed to access resource
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "error": "Error message describing what went wrong",
  "details": {
    "field": "specific error for this field"
  }
}
```

---

## Pagination

For endpoints that return lists, use these query parameters:
- `limit`: Number of items to return (default varies by endpoint)
- `offset`: Number of items to skip (default 0)

Example:
```
GET /dogs/me/list?limit=10&offset=20
```

---

## WebSocket Events (Pusher)

### Connection
```javascript
const pusher = new Pusher(PUSHER_KEY, {
  cluster: PUSHER_CLUSTER
});
```

### Chat Events

**Channel:** `private-conversation-{conversationId}`

**Events:**
- `new-message`: New message received
  ```json
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "content": "Hello!",
    "created_at": "..."
  }
  ```

- `typing`: User is typing
  ```json
  {
    "user_id": "uuid",
    "user_name": "Jane Doe"
  }
  ```

- `message-read`: Message marked as read
  ```json
  {
    "message_id": "uuid",
    "read_by": "uuid"
  }
  ```

### Notification Events

**Channel:** `private-user-{userId}`

**Events:**
- `notification`: New notification received
  ```json
  {
    "id": "uuid",
    "type": "feed_reminder",
    "title": "...",
    "message": "...",
    "created_at": "..."
  }
  ```

---

## Testing Credentials

Use these for testing the OTP flow:

**Phone Number:** Any 10-digit number (e.g., `9876543210`)

**Country Code:** `+91`

**OTP:** `0000` or `000000` (both work)

**Name:** Required for signup, any string 2-100 chars

**Example Test Flow:**
1. Signup: `POST /auth/phone-login` with phone, country_code, otp: "0000", name
2. Get token from response
3. Use token in Authorization header for all subsequent requests

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| Auth (login, signup, phone-login) | 5 requests / 15 min |
| General API | 100 requests / 15 min |
| Upload | 20 requests / 15 min |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Environment Variables

### Backend (.env)

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
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=streetconnect-bucket

# Pusher
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=ap2

# Firebase (Optional)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

### Frontend (.env)

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_PUSHER_KEY=your-pusher-key
EXPO_PUBLIC_PUSHER_CLUSTER=ap2
```

---

## Quick Start

### 1. Clone and Install

```bash
git clone <repo>
cd Streetconnect
npm install  # Root dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env` in both backend and frontend, then update values.

### 3. Start Services

**Option A: With Docker**
```bash
./run.sh docker
# In another terminal:
cd frontend && npx expo start
```

**Option B: Without Docker (requires Postgres & Redis running)**
```bash
./run.sh
# or
npm run dev
```

### 4. Test the API

```bash
# Health check
curl http://localhost:5000/health

# Phone login (use OTP 0000)
curl -X POST http://localhost:5000/api/v1/auth/phone-login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "country_code": "+91",
    "otp": "0000",
    "name": "Test User"
  }'

# Get profile (use token from login response)
curl http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Support

For issues or questions:
- Check the logs: Backend container logs, frontend Metro bundler
- Common issues: Ensure Postgres & Redis are running, check env variables
- OTP not working: Use `0000` or `000000` (six digits)

---

**Last Updated:** February 3, 2026
**API Version:** v1
