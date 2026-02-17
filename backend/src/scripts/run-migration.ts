import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { config } from '../config';

async function runMigration() {
  logger.info('📊 Running database migration...');
  
  const client = new Client({
    connectionString: config.supabase.dbUrl,
  });
  
  try {
    await client.connect();
    logger.info('✅ Connected to Supabase database');
    
    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    logger.info('Executing migration SQL...');
    await client.query(sql);
    
    logger.info('✅ Migration completed successfully!');
    logger.info('\nVerifying tables...');
    
    // Verify tables
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    logger.info(`\nCreated ${rows.length} tables:`);
    rows.forEach((row: any) => {
      logger.info(`  ✅ ${row.table_name}`);
    });
    
    return true;
  } catch (error: any) {
    logger.error('❌ Migration failed:', error.message);
    logger.error('Full error:', error);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    const success = await runMigration();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

main();
