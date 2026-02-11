# StreetConnect - Complete Setup Summary

## What Was Fixed

### 1. OTP Login - 0000 and 000000 Both Work
- Backend accepts both `0000` (4 zeros) and `000000` (6 zeros) as valid dev OTPs
- Frontend OTP screen now has 6 input boxes so you can enter 000000
- Hint updated: "For testing, enter 0000 or 000000"

### 2. Phone Number Normalization
- Backend normalizes phone: when you enter `9876543210` with country +91, it looks up `919876543210` in the database
- New users are stored with full format (`919876543210`)
- Works for both signup and login

### 3. Test User in Seed
- First seeded user: **phone 9999999999**, OTP **0000** or **000000**
- After running seed, you can login immediately with 9999999999

### 4. Error Display
- Fixed API error parsing so "User not found" and other backend errors show correctly in the app

### 5. Database Viewer Script
- Run `npm run show-db` in backend to see all data in the terminal
- Shows: users, dogs, caretakers, feed logs, reports, etc.

---

## You MUST Do This First

Your database has **no tables** yet. The seed failed with:
```
Could not find the table 'public.users' in the schema cache
```

### Step 1: Run SQL Migration (2 min)

1. Open: **https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/sql/new**
2. Open `backend/migrations/001_initial_schema.sql` in your editor
3. Copy the **entire file**
4. Paste into Supabase SQL Editor
5. Click **Run**
6. Check Table Editor - you should see 8 tables

### Step 2: Create Storage Buckets (2 min)

1. Open: **https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/storage/buckets**
2. Create 6 buckets (New bucket → name → Public ✓):
   - dogs
   - reports
   - feed
   - chat
   - qr
   - avatars

### Step 3: Seed the Database

```bash
cd /Users/sauravkumar/Desktop/Streetconnect/backend
npm run seed
```

Expected output:
```
✅ Created 50 users
✅ Created 30 dogs
✅ Generated QR codes
...
```

### Step 4: View Your Data

```bash
npm run show-db
```

### Step 5: Start & Test

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd streetconnectfrontend
npx expo start --clear
```

**Login:**
- Phone: `9999999999`
- OTP: `0000` or `000000`

---

## Login Options

| Scenario | Phone | OTP | Result |
|----------|-------|-----|--------|
| Login (seeded user) | 9999999999 | 0000 or 000000 | Login to Test User |
| Signup (new user) | Any 10 digits | 0000 or 000000 | Create account (enter name) |

---

## View Data in Supabase Dashboard

After seeding:
- **Table Editor**: https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/editor
- Click each table to see rows
- `users` - 50 rows (feeders + rescuers)
- `dogs` - 30 rows with QR codes
- `dog_caretakers` - assignments
- `feed_logs` - feeding history
- `reports` - sample reports

---

## If Login Still Fails

1. **Backend running?** Must see `Server running on port 3000`
2. **Migration run?** Tables must exist - check Table Editor
3. **Seed run?** Must have users - run `npm run show-db` to verify
4. **Phone format?** Use 10 digits: 9999999999 (no spaces, no +91)
5. **OTP?** Use exactly 0000 or 000000 (no spaces)

---

## Files Changed

- `auth.controller.ts` - OTP validation, phone normalization
- `verify-otp.tsx` - 6 OTP boxes, 000000 support, error handling
- `login.tsx` - Placeholder hint
- `seed.ts` - Test user 9999999999
- `show-db.ts` - New script to display database contents
- `001_initial_schema.sql` - PostGIS line commented (optional)
