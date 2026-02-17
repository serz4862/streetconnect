/**
 * Reset database and seed with location-based data
 * CAUTION: This deletes ALL existing data!
 */
import { supabase } from '../services/supabase.service';
import logger from '../utils/logger';
import { execSync } from 'child_process';

async function resetAndSeed(lat: number, lng: number) {
  try {
    logger.info('🗑️  Clearing existing data...\n');

    // Delete in correct order (respecting foreign keys)
    const tables = [
      'notifications',
      'messages',
      'conversations',
      'feed_logs',
      'reports',
      'dog_caretakers',
      'dogs',
      'users',
    ];

    for (const table of tables) {
      logger.info(`  Deleting ${table}...`);
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error && !error.message.includes('no rows')) {
        logger.warn(`    Warning: ${error.message}`);
      } else {
        logger.info(`    ✅ Cleared ${table}`);
      }
    }

    logger.info('\n✅ All data cleared!\n');

    // Run main seed to create test user
    logger.info('🌱 Running initial seed (creates test user)...\n');
    execSync('npm run seed', { stdio: 'inherit', cwd: process.cwd() });

    // Run location-based seed
    logger.info(`\n🌱 Seeding data near location: ${lat}, ${lng}\n`);
    execSync(`npm run seed-location ${lat} ${lng}`, { stdio: 'inherit', cwd: process.cwd() });

    logger.info('\n========================================');
    logger.info('✅ Reset and seed complete!');
    logger.info('========================================\n');

  } catch (error: any) {
    logger.error('❌ Reset failed:', error.message);
    throw error;
  }
}

// Get location from command line or use default
const lat = parseFloat(process.argv[2] || '19.0760');
const lng = parseFloat(process.argv[3] || '72.8777');

logger.info('========================================');
logger.info('⚠️  DATABASE RESET');
logger.info('========================================');
logger.info('This will DELETE ALL existing data and reseed!');
logger.info(`Location: ${lat}, ${lng}`);
logger.info('========================================\n');

resetAndSeed(lat, lng);
