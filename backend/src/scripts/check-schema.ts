/**
 * Check if expected Supabase tables exist and are readable.
 * Run: npm run check-schema
 */
import { supabase } from '../services/supabase.service';
import logger from '../utils/logger';

const EXPECTED_TABLES = [
  'users',
  'dogs',
  'dog_caretakers',
  'feed_logs',
  'reports',
  'conversations',
  'messages',
  'notifications',
  'user_locations',
];

async function main() {
  logger.info('🔍 Checking Supabase schema...\n');

  let allOk = true;
  for (const table of EXPECTED_TABLES) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        logger.warn(`❌ ${table}: ${error.message} (code: ${error.code ?? 'n/a'})`);
        allOk = false;
      } else {
        logger.info(`✅ ${table}`);
      }
    } catch (err: any) {
      logger.warn(`❌ ${table}: ${err?.message ?? err}`);
      allOk = false;
    }
  }

  logger.info('');
  if (allOk) {
    logger.info('✅ Schema OK — all expected tables exist and are readable.');
    logger.info('   If the backend still shows a warning, restart it (npm run dev).');
  } else {
    logger.warn('⚠️  Some tables are missing or not readable.');
    logger.info('   Fix: run backend/migrations/001_initial_schema.sql in Supabase SQL Editor.');
    logger.info('   Dashboard → SQL Editor → New query → Paste file contents → Run');
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error('Check failed:', err);
  process.exit(1);
});
