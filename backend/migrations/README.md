# Supabase migrations

Run these in **Supabase Dashboard → SQL Editor → New query**.

## First-time setup

1. Open your project: [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. Copy the **entire** contents of `001_initial_schema.sql`.
4. Paste into the editor and click **Run**.
5. Restart your backend (`npm run dev`). The "Tables may not exist" warning should be gone.

## Check schema

From the backend folder:

```bash
npm run check-schema
```

This verifies that all expected tables exist and are readable. If any table is missing, run `001_initial_schema.sql` as above.
