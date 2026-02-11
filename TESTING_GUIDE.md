# 🧪 StreetConnect Testing Guide

## ✅ Current Status

### Backend
- ✅ Running on `http://192.168.1.2:3000`
- ✅ Connected to Supabase
- ✅ 50 users seeded (30 feeders + 20 rescuers)
- ✅ 30 dogs with locations, QR codes
- ✅ 12 reports
- ✅ All 7 storage buckets working
- ✅ Media uploads working

### Frontend
- ✅ Running on Expo (port 8081)
- ✅ API URL configured: `http://192.168.1.2:3000/api/v1`
- ✅ Supabase client configured
- ✅ 6-digit OTP input ready

---

## 🔐 Test Login

### Option 1: Use Test Account
**Phone**: `9999999999` (without country code in input)  
**OTP**: `000000` (six zeros)

### Option 2: Create New Account
1. Enter any 10-digit phone number
2. Enter OTP: `000000`
3. Fill in your name
4. Select role (Feeder/Rescuer)
5. Complete onboarding

**Note**: Both `0000` and `000000` work as test OTPs!

---

## 📱 What You Can Test After Login

### 1. View Nearby Dogs
- ✅ Homepage should show map with 30 dogs
- ✅ Each dog has location, color, breed
- ✅ Click on dog to see details

### 2. Add New Dog
- ✅ Click "Add Dog" button
- ✅ **Take photo** or **select from gallery**
- ✅ Fill in dog details (name, color, breed)
- ✅ Mark location on map
- ✅ Save dog
- ✅ Photo uploads to Supabase Storage (`dogs` bucket)

### 3. Create Report
- ✅ Report lost/found/injured dog
- ✅ **Upload photo** of the dog/situation
- ✅ Add description and location
- ✅ **Upload PDF** (optional - medical records)
- ✅ Images/PDFs upload to Supabase Storage (`reports` bucket)

### 4. Feed Logs
- ✅ View unfed dogs nearby
- ✅ Log feeding for a dog
- ✅ **Take photo** of feeding
- ✅ Photo uploads to Supabase Storage (`feed` bucket)

### 5. Chat
- ✅ Message other users
- ✅ **Send images** in chat
- ✅ Images upload to Supabase Storage (`chat` bucket)

### 6. QR Codes
- ✅ Each dog has a generated QR code
- ✅ QR codes stored in Supabase Storage (`qr` bucket)
- ✅ Scan QR to view dog details

### 7. Profile
- ✅ Update your profile
- ✅ **Change avatar**
- ✅ Avatar uploads to Supabase Storage (`avatars` bucket)

---

## 📸 Testing Media Uploads

All these features support image/media uploads:

| Feature | Bucket | Supported Formats |
|---------|--------|-------------------|
| Dog Photos | `dogs` | JPEG, PNG, WebP |
| Report Images | `reports` | JPEG, PNG, WebP |
| Report PDFs | `reports` | PDF |
| Feed Logs | `feed` | JPEG, PNG, WebP |
| Chat Messages | `chat` | JPEG, PNG, WebP |
| User Avatars | `avatars` | JPEG, PNG, WebP |
| QR Codes | `qr` | PNG (auto-generated) |

**How Upload Works:**
1. Frontend requests signed upload URL from backend
2. Backend generates Supabase signed URL
3. Frontend uploads directly to Supabase Storage
4. Public URL is returned and saved in database

---

## 🔍 Verify Data in Supabase Dashboard

**Tables**: https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/editor

Check these tables:
- `users` - 50 users
- `dogs` - 30 dogs
- `dog_caretakers` - 50 caretaker relationships
- `feed_logs` - 20 feed logs
- `reports` - 12 reports
- `conversations` - (will populate when you chat)
- `messages` - (will populate when you send messages)
- `notifications` - (will populate with app activity)

**Storage**: https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/storage/buckets

Check these buckets:
- `dogs` - Dog photos
- `reports` - Report images/PDFs
- `feed` - Feed log photos
- `chat` - Chat images
- `qr` - QR codes (30 auto-generated)
- `avatars` - User avatars

---

## 🧪 API Testing (Advanced)

### Test Login API
```bash
curl -X POST http://192.168.1.2:3000/api/v1/auth/phone-login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","country_code":"+91","otp":"000000"}'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "phone": "919999999999",
    "name": "Test User",
    "role": "feeder"
  },
  "token": "eyJhbG..."
}
```

### Test Upload API
```bash
curl -X POST http://192.168.1.2:3000/api/v1/upload/signed-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"file_type":"image/jpeg","folder":"dogs"}'
```

**Expected Response:**
```json
{
  "upload_url": "https://...supabase.co/storage/v1/object/upload/...",
  "file_url": "https://...supabase.co/storage/v1/object/public/dogs/...",
  "key": "1234567890-abc.jpeg"
}
```

### Test Health Endpoint
```bash
curl http://192.168.1.2:3000/api/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T...",
  "version": "v1"
}
```

---

## 🐛 Troubleshooting

### "Network request failed"
- ✅ **FIXED**: Frontend now uses `http://192.168.1.2:3000/api/v1`
- Make sure your phone/emulator is on the same WiFi network
- Check backend is running: `curl http://192.168.1.2:3000/api/v1/health`

### "User not found"
- Make sure you're using the test account: `9999999999`
- Or create a new account by providing a name during OTP verification

### "Invalid OTP"
- Use `000000` (six zeros) for testing
- `0000` (four zeros) also works

### Image Upload Fails
- Check storage buckets exist: `npm run check-buckets`
- Verify Supabase credentials in `.env`
- Check network connectivity

### Can't See Dogs on Map
- Verify location permissions are granted to the app
- Check if dogs exist in database: `npm run show-db`
- Test API: `curl http://192.168.1.2:3000/api/v1/dogs/nearby?latitude=19.0760&longitude=72.8777`

---

## 📊 Database Commands

**View all data:**
```bash
cd /Users/sauravkumar/Desktop/Streetconnect/backend
npm run show-db
```

**Check storage buckets:**
```bash
npm run check-buckets
```

**Re-seed data (if needed):**
```bash
# Clear existing data first in Supabase dashboard, then:
npm run seed
```

---

## 🎯 Test Checklist

- [ ] Login with `9999999999` / `000000`
- [ ] View nearby dogs on map
- [ ] Click on a dog to see details
- [ ] Add a new dog with photo
- [ ] Create a report with image
- [ ] Log feeding for a dog
- [ ] Send a message to another user
- [ ] Upload avatar in profile
- [ ] View QR code for a dog
- [ ] Check data appears in Supabase dashboard

---

## 🚀 Everything Working!

Your StreetConnect app is fully functional with:
- ✅ Supabase database (PostgreSQL)
- ✅ Supabase Storage (replaces AWS S3)
- ✅ Supabase Auth integration
- ✅ Redis caching
- ✅ Real-time features ready
- ✅ Media upload/download
- ✅ Test data seeded
- ✅ Mobile app running

**Start testing and enjoy your fully migrated StreetConnect app!** 🐕
