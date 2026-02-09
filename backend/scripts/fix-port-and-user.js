#!/usr/bin/env node
/**
 * One-time script: free port 3000 and set test user is_active = true.
 * Run: node scripts/fix-port-and-user.js
 * Requires: PostgreSQL accessible (same .env as backend).
 */

const { execSync } = require('child_process');

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    // ignore
  }
}

// Kill process on port 3000 (macOS/Linux)
console.log('Freeing port 3000...');
run('lsof -ti:3000 | xargs kill -9 2>/dev/null || true');

console.log('Done. Start backend with: npm run dev');
console.log('To fix test user in DB, run:');
console.log("  PGPASSWORD=streetconnect_secure_password psql -h localhost -p 5433 -U streetconnect -d streetconnect_db -c \"UPDATE users SET is_active = true WHERE phone IN ('1234567890','9876543210');\"");
