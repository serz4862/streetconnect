/**
 * Initialize Supabase database using REST API
 * Creates tables using Supabase's query endpoint
 */
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { config } from '../config';
import { supabase } from '../services/supabase.service';

async function executeSQLViaRPC(sql: string): Promise<boolean> {
  try {
    // Supabase allows executing raw SQL via RPC if we create a function first
    // Or we can use the postgres-meta API
    
    // Split into manageable chunks
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    logger.info(`Found ${statements.length} SQL statements`);
    
    // Try using the service role to execute via stored procedure
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip comments and empty
      if (stmt.startsWith('--') || stmt.length < 5) continue;
      
      try {
        // Execute via raw query using supabase-js (v2 doesn't support this directly)
        // We need to use the postgres REST API endpoint
        const response = await fetch(
          `${config.supabase.url}/rest/v1/rpc`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.supabase.serviceRoleKey,
              'Authorization': `Bearer ${config.supabase.serviceRoleKey}`,
            },
            body: JSON.stringify({
              query: stmt + ';'
            }),
          }
        );

        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          logger.warn(`Statement ${i + 1}: ${errorText.substring(0, 100)}`);
        }
        
        if ((i + 1) % 20 === 0) {
          logger.info(`Progress: ${i + 1}/${statements.length}...`);
        }
      } catch (error: any) {
        // Some errors are OK (e.g., already exists)
        if (!error.message?.includes('already exists')) {
          logger.warn(`Error at statement ${i + 1}:`, error.message?.substring(0, 100));
        }
      }
    }
    
    return true;
  } catch (error: any) {
    logger.error('Execution error:', error.message);
    return false;
  }
}

async function createTablesDirectly() {
  logger.info('🔨 Creating Supabase database tables...\n');
  
  try {
    // Test connection first
    const { error: testError } = await supabase.from('users').select('count').limit(1);
    
    if (!testError) {
      logger.info('✅ Tables already exist!');
      return true;
    }
    
    logger.info('📋 Tables not found. Creating schema...');
    
    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    await executeSQLViaRPC(sql);
    
    // Verify
    const { error: verifyError } = await supabase.from('users').select('count').limit(1);
    
    if (verifyError) {
      logger.error('\n❌ Tables still not created. Please run migration manually:');
      logger.error('1. Open: https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/sql/new');
      logger.error('2. Copy: backend/migrations/001_initial_schema.sql');
      logger.error('3. Paste and Run');
      return false;
    }
    
    logger.info('\n✅ Tables created successfully!');
    return true;
  } catch (error: any) {
    logger.error('Error:', error.message);
    return false;
  }
}

async function createBuckets() {
  logger.info('\n🗄️  Creating storage buckets...');
  
  const buckets = ['dogs', 'reports', 'feed', 'chat', 'qr', 'avatars'];
  
  for (const bucketName of buckets) {
    try {
      const { data: existing } = await supabase.storage.listBuckets();
      const bucketExists = existing?.some(b => b.name === bucketName);
      
      if (bucketExists) {
        logger.info(`✅ Bucket '${bucketName}' exists`);
        continue;
      }
      
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (error) {
        logger.warn(`⚠️  Could not create '${bucketName}': ${error.message}`);
      } else {
        logger.info(`✅ Created bucket '${bucketName}'`);
      }
    } catch (error: any) {
      logger.warn(`Error with bucket '${bucketName}':`, error.message);
    }
  }
  
  return true;
}

async function main() {
  try {
    const tablesCreated = await createTablesDirectly();
    
    if (!tablesCreated) {
      logger.error('\n❌ Setup incomplete. Follow the manual steps above.');
      process.exit(1);
    }
    
    await createBuckets();
    
    logger.info('\n========================================');
    logger.info('✅ Database initialization complete!');
    logger.info('\nNext: Run seed script:');
    logger.info('  npm run seed');
    logger.info('========================================\n');
    
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

main();
