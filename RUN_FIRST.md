# Run This First - Database Setup

The seed failed because the database tables don't exist yet. You **must** run the SQL migration in Supabase first.

## Step 1: Run SQL Migration (2 minutes)

1. **Open the Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/sql/new
   ```

2. **Copy the entire file:** `backend/migrations/001_initial_schema.sql`

3. **Paste** into the SQL Editor and click **Run**

4. **Verify:** Go to **Table Editor** - you should see 8 tables:
   - users
   - dogs
   - dog_caretakers
   - feed_logs
   - reports
   - conversations
   - messages
   - notifications

## Step 2: Create Storage Buckets (2 minutes)

1. **Open Storage:**
   ```
   https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/storage/buckets
   ```

2. **Create 6 public buckets:**
   - dogs
   - reports
   - feed
   - chat
   - qr
   - avatars

   (Click "New bucket" → Enter name → Check "Public bucket" → Create)

## Step 3: Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- 50 users (including test user 9999999999)
- 30 dogs with QR codes
- Dog caretakers, feed logs, reports

## Step 4: View Database Contents

```bash
cd backend
npm run show-db
```

Shows counts and sample data from all tables.

## Step 5: Start Backend & Test Login

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd streetconnectfrontend
npx expo start --clear
```

## Login Options

| Phone       | OTP      | Result                          |
|-------------|----------|---------------------------------|
| 9999999999  | 0000     | Login to seeded test user       |
| 9999999999  | 000000   | Login to seeded test user       |
| Any 10-digit| 0000     | Signup (enter name when prompted)|
| Any 10-digit| 000000   | Signup (enter name when prompted)|

---

**Without Step 1 & 2, nothing will work.** The migration creates the tables; without them, the app cannot store or fetch data.
