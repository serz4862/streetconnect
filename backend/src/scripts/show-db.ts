/**
 * Show all data in the database - run: npm run show-db
 */
import { supabase } from '../services/supabase.service';
import logger from '../utils/logger';

async function main() {
  try {
    logger.info('📊 Fetching database contents...\n');

    const [users, dogs, caretakers, feedLogs, reports, conversations, messages, notifications] = await Promise.all([
      supabase.from('users').select('id, phone, name, role, city, onboarding_completed').limit(100),
      supabase.from('dogs').select('id, name, color, gender, latitude, longitude, qr_code_id').limit(100),
      supabase.from('dog_caretakers').select('id, dog_id, user_id, caretaker_type').limit(50),
      supabase.from('feed_logs').select('id, dog_id, user_id, fed_at').limit(20),
      supabase.from('reports').select('id, type, title, status, user_id').limit(20),
      supabase.from('conversations').select('id, user1_id, user2_id').limit(10),
      supabase.from('messages').select('id, conversation_id, content').limit(10),
      supabase.from('notifications').select('id, user_id, type, title').limit(10),
    ]);

    logger.info('=== USERS ===');
    logger.info(`Total: ${users.data?.length ?? 0}`);
    if (users.data?.length) {
      users.data.slice(0, 5).forEach((u: any) => logger.info(`  ${u.phone} | ${u.name} | ${u.role}`));
      if (users.data.length > 5) logger.info(`  ... and ${users.data.length - 5} more`);
    }
    logger.info('');

    logger.info('=== DOGS ===');
    logger.info(`Total: ${dogs.data?.length ?? 0}`);
    if (dogs.data?.length) {
      dogs.data.slice(0, 5).forEach((d: any) => logger.info(`  ${d.name} | ${d.color} | ${d.gender} | ${d.latitude},${d.longitude}`));
      if (dogs.data.length > 5) logger.info(`  ... and ${dogs.data.length - 5} more`);
    }
    logger.info('');

    logger.info('=== DOG CARETAKERS ===');
    logger.info(`Total: ${caretakers.data?.length ?? 0}`);
    logger.info('');

    logger.info('=== FEED LOGS ===');
    logger.info(`Total: ${feedLogs.data?.length ?? 0}`);
    logger.info('');

    logger.info('=== REPORTS ===');
    logger.info(`Total: ${reports.data?.length ?? 0}`);
    if (reports.data?.length) {
      reports.data.slice(0, 3).forEach((r: any) => logger.info(`  ${r.title} | ${r.type} | ${r.status}`));
    }
    logger.info('');

    logger.info('=== CONVERSATIONS ===');
    logger.info(`Total: ${conversations.data?.length ?? 0}`);
    logger.info('');

    logger.info('=== MESSAGES ===');
    logger.info(`Total: ${messages.data?.length ?? 0}`);
    logger.info('');

    logger.info('=== NOTIFICATIONS ===');
    logger.info(`Total: ${notifications.data?.length ?? 0}`);
    logger.info('');

    logger.info('========================================');
    logger.info('✅ Database summary complete');
    logger.info('');
    logger.info('Test login: phone 9999999999, OTP 0000 or 000000');
    logger.info('Or signup with any 10-digit phone + OTP 0000/000000');
    logger.info('========================================');

    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
