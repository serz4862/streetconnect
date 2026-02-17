import { supabase } from '../services/supabase.service';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

const STORAGE_BUCKETS = ['dogs', 'reports', 'feed', 'chat', 'qr', 'avatars'];

async function testConnection() {
  logger.info('🔍 Testing Supabase connection...');
  
  try {
    // Test via storage (works even when tables don't exist yet)
    const { error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      // Fallback: test via users table (requires migration run)
      const { error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        logger.error('❌ Connection test failed:', error.message);
        logger.info('💡 Run the SQL migration first: backend/migrations/001_initial_schema.sql');
        return false;
      }
    }
    
    logger.info('✅ Supabase connection successful!');
    return true;
  } catch (error: any) {
    logger.error('❌ Connection error:', error?.message || error);
    return false;
  }
}

async function runMigration() {
  logger.info('📊 Checking database migration...');
  
  try {
    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      logger.error('❌ Migration file not found:', migrationPath);
      return false;
    }
    
    logger.warn('⚠️  Note: Large SQL scripts should be run directly in Supabase SQL Editor');
    logger.info('Please run the migration manually:');
    logger.info('1. Go to https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/sql/new');
    logger.info('2. Copy contents of backend/migrations/001_initial_schema.sql');
    logger.info('3. Paste and click "Run"');
    
    // Try to verify if tables exist
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (!error) {
      logger.info('✅ Tables already exist or migration successful!');
      return true;
    }
    
    return false;
  } catch (error: any) {
    logger.error('❌ Migration error:', error.message);
    return false;
  }
}

async function createStorageBuckets() {
  logger.info('🗄️  Setting up storage buckets...');
  
  for (const bucketName of STORAGE_BUCKETS) {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);
      
      if (bucketExists) {
        logger.info(`✅ Bucket '${bucketName}' already exists`);
        continue;
      }
      
      // Create bucket
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (error) {
        logger.error(`❌ Failed to create bucket '${bucketName}':`, error.message);
        continue;
      }
      
      logger.info(`✅ Created bucket '${bucketName}'`);
    } catch (error: any) {
      logger.error(`❌ Error creating bucket '${bucketName}':`, error.message);
    }
  }
  
  logger.info('✅ Storage bucket setup complete!');
  return true;
}

async function verifySetup() {
  logger.info('🔍 Verifying setup...');
  
  // Check tables
  const tables = ['users', 'dogs', 'dog_caretakers', 'feed_logs', 'reports', 'conversations', 'messages', 'notifications'];
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        logger.warn(`⚠️  Table '${table}' may not exist`);
        allTablesExist = false;
      } else {
        logger.info(`✅ Table '${table}' exists`);
      }
    } catch (error) {
      logger.error(`❌ Error checking table '${table}'`);
      allTablesExist = false;
    }
  }
  
  // Check buckets
  const { data: buckets } = await supabase.storage.listBuckets();
  logger.info(`\n📦 Storage buckets (${buckets?.length || 0}):`);
  buckets?.forEach(bucket => {
    logger.info(`  ✅ ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
  });
  
  return allTablesExist;
}

async function main() {
  try {
    logger.info('🚀 Starting Supabase setup...\n');
    
    // Step 1: Test connection
    const connected = await testConnection();
    if (!connected) {
      logger.error('❌ Cannot connect to Supabase. Check your credentials in .env');
      process.exit(1);
    }
    
    logger.info('');
    
    // Step 2: Run migration (or guide user)
    await runMigration();
    
    logger.info('');
    
    // Step 3: Create storage buckets
    await createStorageBuckets();
    
    logger.info('');
    
    // Step 4: Verify setup
    const setupComplete = await verifySetup();
    
    logger.info('');
    logger.info('='.repeat(60));
    
    if (setupComplete) {
      logger.info('✅ Supabase setup complete!');
      logger.info('\nNext steps:');
      logger.info('1. Run: npm run seed (to populate database with test data)');
      logger.info('2. Run: npm run dev (to start backend server)');
      logger.info('3. Test the app!');
    } else {
      logger.warn('⚠️  Setup incomplete. Please:');
      logger.info('1. Go to https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/sql/new');
      logger.info('2. Copy contents of backend/migrations/001_initial_schema.sql');
      logger.info('3. Paste and run the migration');
      logger.info('4. Run this script again: npm run setup');
    }
    
    logger.info('='.repeat(60));
    
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
