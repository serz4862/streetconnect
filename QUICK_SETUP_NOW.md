# ⚡ QUICK SETUP - DO THIS NOW

## 🎯 You Need to Run SQL Migration (2 Minutes!)

**Your database is NOT connected because the tables don't exist yet.**

### ✅ Option 1: Automated Setup (Recommended)

Run this ONE command:
```bash
cd /Users/sauravkumar/Desktop/Streetconnect/backend && npm run complete-setup
```

This will:
1. Open Supabase SQL Editor in your browser
2. Show you the SQL to copy-paste
3. Wait for you to run it
4. Automatically create storage buckets
5. Automatically seed all data
6. Show you all seeded data

### ✅ Option 2: Manual Setup (If automation fails)

**Step 1: Run Migration (60 seconds)**
1. Open: https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/sql/new
2. Copy the ENTIRE file: `backend/migrations/001_initial_schema.sql`
3. Paste into the SQL Editor
4. Click "RUN" button (or press Cmd+Enter)
5. Wait for "Success" message (~10-20 seconds)

**Step 2: Run Setup (30 seconds)**
```bash
cd /Users/sauravkumar/Desktop/Streetconnect/backend
npm run complete-setup
```

---

## 🚀 After Setup Completes

Your app will be ready with:
- ✅ 50 test users (30 feeders + 20 rescuers)
- ✅ 30 dogs with QR codes, caretakers, feed logs
- ✅ 15+ reports
- ✅ Test login: **Phone: 9999999999**, **OTP: 000000** (six zeros)

## 📱 Start the App

**Backend:**
```bash
cd /Users/sauravkumar/Desktop/Streetconnect/backend
npm run dev
```

**Frontend (new terminal):**
```bash
cd /Users/sauravkumar/Desktop/Streetconnect/streetconnectfrontend
npm start
```

## 🔍 View Your Data

**In Supabase Dashboard:**
- Tables: https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/editor

**In Terminal:**
```bash
cd /Users/sauravkumar/Desktop/Streetconnect/backend
npm run show-db
```

---

## ❓ Why This Is Required

Supabase doesn't allow creating tables via their API or remote connections for security reasons. You MUST run the SQL migration once in their web dashboard. After that, everything else is automated!

**This is a ONE-TIME setup. Do it now, and you'll never need to do it again!**
