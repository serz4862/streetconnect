/**
 * Create Supabase tables programmatically
 * This runs the SQL migration via direct PostgreSQL connection
 */
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import { config } from '../config';

async function createTables() {
  logger.info('🔨 Creating Supabase tables...');
  
  // Use service role key to construct direct connection
  const projectRef = config.supabase.url.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
  
  if (!projectRef) {
    logger.error('❌ Could not extract project reference from URL');
    return false;
  }

  // For direct connection, we need the password in the connection string
  // Using session pooler which is more reliable
  const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent('$trayConnect2026!')}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
  
  const client = new Client({ connectionString });
  
  try {
    logger.info('Connecting to Supabase database...');
    await client.connect();
    logger.info('✅ Connected!');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    logger.info('Running migration...');
    await client.query(sql);
    
    logger.info('✅ Migration completed successfully!');
    
    // Verify tables
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    logger.info(`\n✅ Created ${rows.length} tables:`);
    rows.forEach((row: any) => {
      logger.info(`  • ${row.table_name}`);
    });
    
    return true;
  } catch (error: any) {
    logger.error('❌ Failed to create tables:', error.message);
    logger.error('\nFallback: Run migration manually in Supabase SQL Editor:');
    logger.error('1. https://supabase.com/dashboard/project/jqgemewsbmwhckajxjkn/sql/new');
    logger.error('2. Copy contents of backend/migrations/001_initial_schema.sql');
    logger.error('3. Paste and click Run');
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  const success = await createTables();
  process.exit(success ? 0 : 1);
}

main();
