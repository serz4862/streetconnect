import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { config } from '../config';

async function runMigrationViaAPI() {
  logger.info('📊 Running database migration via Supabase API...');
  
  try {
    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split SQL into individual statements (simple approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    logger.info(`Found ${statements.length} SQL statements to execute...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        const response = await fetch(
          `${config.supabase.url}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.supabase.serviceRoleKey,
              'Authorization': `Bearer ${config.supabase.serviceRoleKey}`,
            },
            body: JSON.stringify({ query: statement }),
          }
        );
        
        if (response.ok) {
          successCount++;
          if ((i + 1) % 10 === 0) {
            logger.info(`Progress: ${i + 1}/${statements.length} statements executed...`);
          }
        } else {
          const error = await response.text();
          // Some statements might fail if already exists, that's ok
          if (!error.includes('already exists')) {
            logger.warn(`Statement ${i + 1} warning: ${error.substring(0, 100)}`);
            errorCount++;
          }
        }
      } catch (error: any) {
        logger.warn(`Error executing statement ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    logger.info(`\n✅ Migration completed!`);
    logger.info(`  Success: ${successCount} statements`);
    logger.info(`  Errors/Warnings: ${errorCount} statements`);
    
    return true;
  } catch (error: any) {
    logger.error('❌ Migration failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    logger.warn('\n⚠️  Note: This uses a simple SQL splitting approach.');
    logger.warn('For best results, run the migration directly in Supabase SQL Editor:');
    logger.warn('https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/sql/new\n');
    
    const success = await runMigrationViaAPI();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

main();
