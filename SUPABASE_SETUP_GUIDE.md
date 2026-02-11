# Supabase Migration Setup Guide

## Current Status

### ✅ Completed

1. **SQL Migration Script Created**: `backend/migrations/001_initial_schema.sql`
   - All 8 tables with proper schema
   - Enums, indexes, foreign keys, RLS policies
   - Auto-update triggers for `updated_at` fields

2. **Backend Infrastructure Updated**:
   - ✅ Supabase client installed (`@supabase/supabase-js`)
   - ✅ Config updated with Supabase settings
   - ✅ `backend/src/services/supabase.service.ts` created
   - ✅ `backend/src/services/storage.service.ts` created (replaces S3)
   - ✅ Upload controller updated to use Supabase Storage
   - ✅ QR code service updated to use Supabase Storage
   - ✅ PDF service updated to use Supabase Storage

3. **Controllers Migrated to Supabase**:
   - ✅ `auth.controller.ts` (phone login, signup, login, refresh token)
   - ✅ `user.controller.ts` (profile, role, onboarding, location)
   - ✅ `auth.ts` middleware (JWT verification with Supabase user lookup)

### ⏳ Pending (Requires Your Action)

1. **Create Supabase Project** (5 minutes)
2. **Run SQL Migration** (2 minutes)
3. **Create Storage Buckets** (2 minutes)
4. **Add Credentials to .env** (1 minute)
5. **Test & Verify** (10 minutes)

---

## Step-by-Step Setup Instructions

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Organization**: Choose or create one
   - **Project Name**: `streetconnect` (or your preference)
   - **Database Password**: Create a strong password and **SAVE IT**
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### Step 2: Get Your Credentials

Once the project is created:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **anon public key**: Starts with `eyJ...` (for frontend)
   - **service_role key**: Starts with `eyJ...` (for backend) ⚠️ **KEEP SECRET**

3. Go to **Project Settings** → **Database**
4. Copy the **Connection string** (Pooler mode recommended for serverless)

### Step 3: Add Credentials to Backend

Edit `backend/.env` and add:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (your service role key)
SUPABASE_ANON_KEY=eyJhbGciOi... (your anon key)
SUPABASE_DB_URL=postgresql://postgres.[your-project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Step 4: Run SQL Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `backend/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" or press `Cmd/Ctrl + Enter`
6. ✅ You should see "Success. No rows returned"

7. Verify tables were created:
   - Go to **Table Editor** in the sidebar
   - You should see all 8 tables: users, dogs, dog_caretakers, feed_logs, reports, conversations, messages, notifications

### Step 5: Create Storage Buckets

1. In Supabase Dashboard, go to **Storage**
2. Click "New bucket"
3. Create these **6 public buckets** (one by one):

| Bucket Name | Public | Description |
|-------------|--------|-------------|
| `dogs` | ✅ Yes | Dog photos |
| `reports` | ✅ Yes | Report images and PDFs |
| `feed` | ✅ Yes | Feed log images |
| `chat` | ✅ Yes | Chat images |
| `qr` | ✅ Yes | QR code images |
| `avatars` | ✅ Yes | User profile pictures |

4. For each bucket, configure:
   - **Public bucket**: Enable
   - **Allowed MIME types**: `image/*` for image buckets, add `application/pdf` for reports bucket
   - **File size limit**: 5 MB (adjust as needed)

### Step 6: Configure RLS Policies for Storage

For each bucket, add these policies (go to bucket → Policies):

**Policy 1: Allow authenticated uploads**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dogs'); -- Change bucket name for each
```

**Policy 2: Allow public reads**
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dogs'); -- Change bucket name for each
```

**Policy 3: Allow authenticated updates/deletes**
```sql
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'dogs'); -- Change bucket name for each

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dogs'); -- Change bucket name for each
```

### Step 7: Test Backend Connection

```bash
cd backend
npm run dev
```

Check the logs for:
```
✅ Supabase client initialized
✅ Supabase connection successful
🚀 Server running on port 8000
```

If you see errors, check your `.env` credentials.

### Step 8: Update Frontend

1. Add Supabase credentials to `streetconnectfrontend/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (your anon key)
```

2. Install Supabase client:

```bash
cd streetconnectfrontend
npm install @supabase/supabase-js
```

3. The Supabase client file has been created at `streetconnectfrontend/services/supabase.ts`

### Step 9: Run Seed Script

Once the backend is running with Supabase:

```bash
cd backend
npm run seed
```

This will create:
- 30 feeders
- 20 rescuers
- 30 dogs with QR codes
- Assign dogs to caretakers
- Sample feed logs and reports

Verify in Supabase Dashboard → **Table Editor** → check `users`, `dogs`, etc.

### Step 10: Test the App

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd streetconnectfrontend
   npx expo start --clear
   ```

3. Test these flows:
   - ✅ Phone login with OTP (0000)
   - ✅ Location permission
   - ✅ Role selection
   - ✅ View dogs on map
   - ✅ Scan QR code
   - ✅ Add new dog with image
   - ✅ Create report
   - ✅ Send message

---

## Troubleshooting

### Error: "Supabase client not initialized"

- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `backend/.env`
- Restart the backend server

### Error: "Failed to create signed upload URL"

- Verify storage buckets are created and set to **public**
- Check bucket names match exactly (`dogs`, `reports`, etc.)
- Verify RLS policies are configured for storage

### Error: "User not found" after login

- Check that the SQL migration ran successfully
- Verify the `users` table exists in Supabase
- Check backend logs for detailed error messages

### Error: "Invalid or expired token"

- Clear app storage and re-login
- Verify `JWT_SECRET` in `.env` matches between old and new setup

---

## Remaining Controllers to Migrate

These controllers still use Sequelize and need to be migrated to Supabase:

1. **dog.controller.ts** - CRUD operations for dogs
2. **report.controller.ts** - Report creation and management
3. **feed.controller.ts** - Feed log operations
4. **message.controller.ts** - Messaging system
5. **notification.controller.ts** - Notifications

### Migration Pattern

For each controller, replace Sequelize patterns with Supabase equivalents:

**Before (Sequelize):**
```typescript
const dog = await Dog.findByPk(dogId);
await Dog.create({ name, color, ... });
await dog.update({ name: 'New Name' });
await dog.destroy();
```

**After (Supabase):**
```typescript
const { data: dog } = await supabase.from('dogs').select('*').eq('id', dogId).single();
const { data } = await supabase.from('dogs').insert({ name, color, ... }).select().single();
const { data } = await supabase.from('dogs').update({ name: 'New Name' }).eq('id', dogId).select().single();
await supabase.from('dogs').delete().eq('id', dogId);
```

**Important differences:**
- Supabase returns `{ data, error }` - always check for errors
- Use `.select()` after insert/update to get the new data
- Use `.single()` for one result, otherwise you get an array
- Use `.eq()`, `.in()`, `.gt()`, etc. for filters

---

## Database Schema Reference

### Tables Created

1. **users** - User accounts
2. **dogs** - Street dogs
3. **dog_caretakers** - Many-to-many: dogs ↔ users
4. **feed_logs** - Feed history
5. **reports** - User reports
6. **conversations** - Chat conversations
7. **messages** - Chat messages
8. **notifications** - User notifications

### Key Relationships

- User (1) → Dogs (N) via `created_by`
- User (N) ↔ Dog (M) via `dog_caretakers`
- Dog (1) → FeedLogs (N)
- Dog (1) → Reports (N)
- User (1) ↔ User (1) → Conversation
- Conversation (1) → Messages (N)

---

## Next Steps After Migration

1. **Replace Redis location tracking** with Supabase Realtime or PostGIS queries
2. **Integrate MSG91 for OTP** (replace dev OTP 0000)
3. **Create Next.js admin dashboard** with Supabase client
4. **Implement real-time features** using Supabase Realtime
5. **Add performance optimizations** (FlatList, useCallback, useMemo)
6. **Enhance UI/UX** (loading states, search/filter, better profiles)

---

## Support

If you encounter issues:

1. Check Supabase Dashboard → **Logs** for errors
2. Check backend console logs
3. Verify all credentials in `.env` files
4. Ensure RLS policies allow your operations
5. Test individual API endpoints with Postman/Thunder Client

Good luck! 🚀
