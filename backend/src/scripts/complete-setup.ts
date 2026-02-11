/**
 * Complete automated setup after SQL migration
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { supabase } from '../services/supabase.service';
import path from 'path';

const execAsync = promisify(exec);

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorLog(color: string, message: string) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function printBox(title: string, lines: string[], color = COLORS.cyan) {
  const width = Math.max(...lines.map(l => l.length), title.length) + 4;
  const border = '═'.repeat(width);
  
  colorLog(color, `\n╔${border}╗`);
  colorLog(color, `║ ${title.padEnd(width - 2)} ║`);
  colorLog(color, `╠${border}╣`);
  lines.forEach(line => {
    colorLog(color, `║ ${line.padEnd(width - 2)} ║`);
  });
  colorLog(color, `╚${border}╝\n`);
}

async function waitForKeypress(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

async function checkTables(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function openSQLEditor() {
  const url = 'https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/sql/new';
  const migrationPath = path.resolve(__dirname, '../../migrations/001_initial_schema.sql');
  
  printBox('🚀 AUTOMATED SETUP', [
    'Opening Supabase SQL Editor in your browser...',
    '',
    'Migration file location:',
    migrationPath,
  ], COLORS.cyan);
  
  try {
    // Open browser
    await execAsync(`open "${url}"`);
    
    colorLog(COLORS.yellow, '\n📋 INSTRUCTIONS:');
    console.log('1. Copy the ENTIRE file: backend/migrations/001_initial_schema.sql');
    console.log('2. Paste into the SQL Editor in your browser');
    console.log('3. Click the "RUN" button (or press Cmd+Enter)');
    console.log('4. Wait for "Success" message (~10-20 seconds)');
    console.log('5. Come back here and press ENTER to continue\n');
    
    colorLog(COLORS.green, '⏸️  Waiting for you to run the migration...');
    colorLog(COLORS.bright, '\n[Press ENTER after you see "Success" in Supabase]');
    
    await waitForKeypress();
    
  } catch (error: any) {
    colorLog(COLORS.yellow, '\n⚠️  Could not open browser automatically.');
    colorLog(COLORS.yellow, `Please open manually: ${url}\n`);
  }
}

async function createStorageBuckets() {
  colorLog(COLORS.cyan, '\n🗄️  Creating storage buckets...');
  
  const buckets = ['dogs', 'reports', 'feed', 'chat', 'qr', 'avatars'];
  
  for (const bucketName of buckets) {
    try {
      const { data: existing } = await supabase.storage.listBuckets();
      const bucketExists = existing?.some(b => b.name === bucketName);
      
      if (bucketExists) {
        colorLog(COLORS.green, `  ✅ Bucket '${bucketName}' exists`);
        continue;
      }
      
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (error && !error.message.includes('already exists')) {
        colorLog(COLORS.yellow, `  ⚠️  Could not create '${bucketName}': ${error.message}`);
      } else {
        colorLog(COLORS.green, `  ✅ Created bucket '${bucketName}'`);
      }
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        colorLog(COLORS.yellow, `  ⚠️  Error with bucket '${bucketName}': ${error.message}`);
      }
    }
  }
}

async function runSeed() {
  colorLog(COLORS.cyan, '\n🌱 Seeding database...');
  colorLog(COLORS.yellow, '   This will create 50 users + 30 dogs + reports...\n');
  
  try {
    const { stdout } = await execAsync('npm run seed', { 
      cwd: path.resolve(__dirname, '../..'),
      maxBuffer: 10 * 1024 * 1024
    });
    console.log(stdout);
  } catch (error: any) {
    colorLog(COLORS.red, `\n❌ Seed failed: ${error.message}`);
    throw error;
  }
}

async function showDatabase() {
  colorLog(COLORS.cyan, '\n📊 Fetching database contents...\n');
  
  try {
    const { stdout } = await execAsync('npm run show-db', {
      cwd: path.resolve(__dirname, '../..'),
      maxBuffer: 10 * 1024 * 1024
    });
    console.log(stdout);
  } catch (error: any) {
    colorLog(COLORS.yellow, `\n⚠️  Could not fetch data: ${error.message}`);
  }
}

async function main() {
  try {
    printBox('🎯 STREETCONNECT - COMPLETE SETUP', [
      'This script will guide you through the complete setup',
      '',
      'Steps:',
      '1. Check if tables exist',
      '2. Run SQL migration (if needed)',
      '3. Create storage buckets',
      '4. Seed test data',
      '5. Show database contents',
    ], COLORS.blue);
    
    // Step 1: Check tables
    colorLog(COLORS.cyan, '🔍 Step 1: Checking database tables...');
    const tablesExist = await checkTables();
    
    if (!tablesExist) {
      colorLog(COLORS.yellow, '⚠️  Tables not found. You need to run the SQL migration.\n');
      await openSQLEditor();
      
      // Verify migration was run
      colorLog(COLORS.cyan, '\n🔍 Verifying migration...');
      const tablesCreated = await checkTables();
      
      if (!tablesCreated) {
        printBox('❌ MIGRATION NOT COMPLETED', [
          'Tables still don\'t exist.',
          '',
          'Please:',
          '1. Make sure you ran the SQL in Supabase',
          '2. Check for any error messages',
          '3. Run this script again after fixing',
        ], COLORS.red);
        process.exit(1);
      }
      
      colorLog(COLORS.green, '✅ Tables created successfully!');
    } else {
      colorLog(COLORS.green, '✅ Tables already exist!');
    }
    
    // Step 2: Create buckets
    colorLog(COLORS.cyan, '\n📦 Step 2: Setting up storage...');
    await createStorageBuckets();
    
    // Step 3: Seed data
    colorLog(COLORS.cyan, '\n🌱 Step 3: Seeding test data...');
    await runSeed();
    
    // Step 4: Show data
    await showDatabase();
    
    // Success summary
    printBox('✅ SETUP COMPLETE!', [
      '',
      'Your database is ready with:',
      '  • 50 test users (30 feeders + 20 rescuers)',
      '  • 30 dogs with QR codes and caretakers',
      '  • 15+ reports',
      '  • Feed logs',
      '',
      '🔐 Test Login:',
      '  Phone: 9999999999',
      '  OTP: 000000 (six zeros)',
      '',
      '🚀 Next Steps:',
      '  1. Start backend: npm run dev',
      '  2. Start frontend: cd ../streetconnectfrontend && npm start',
      '  3. Test login in the app',
      '',
      '📊 View Data:',
      '  • Supabase: https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn',
      '  • Terminal: npm run show-db',
    ], COLORS.green);
    
    process.exit(0);
  } catch (error: any) {
    printBox('❌ SETUP FAILED', [
      error.message,
      '',
      'Check the error above and try again.',
      'For manual setup, see: QUICK_SETUP_NOW.md',
    ], COLORS.red);
    process.exit(1);
  }
}

main();
