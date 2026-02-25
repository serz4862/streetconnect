import { config } from './index';
import logger from '../utils/logger';

// Always use Supabase - no local database fallback
export const connectDatabase = async (): Promise<void> => {
  if (!config.supabase?.url || !config.supabase?.serviceRoleKey) {
    logger.error('❌ Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  try {
    logger.info('🔗 Connecting to Supabase...');
    const { supabase } = await import('../services/supabase.service');

    // Test by querying users table (required for auth)
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      logger.warn('⚠️  Supabase schema issue:', error.message);
      logger.warn('   Code: ' + (error.code ?? 'unknown') + ' — Tables may not exist or RLS may block access.');
      logger.info('📋 To fix: run the migration in Supabase SQL Editor.');
      logger.info('   1. Open Supabase Dashboard → SQL Editor → New query');
      logger.info('   2. Copy contents of backend/migrations/001_initial_schema.sql');
      logger.info('   3. Paste and click Run');
      logger.info('   Then restart the backend. Schema check: npm run check-schema');
      logger.info('✅ Supabase connection OK (schema may need migration)');
      return;
    }

    logger.info('✅ Supabase connection verified (users table OK)');
  } catch (error) {
    logger.error('❌ Supabase connection failed:', error);
    process.exit(1);
  }
};
