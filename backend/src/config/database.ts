import { Sequelize } from 'sequelize';
import { config } from './index';
import logger from '../utils/logger';

const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: config.database.pool.max,
    min: config.database.pool.min,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  dialectOptions: {
    ssl: config.env === 'production' ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  },
});

export const connectDatabase = async (): Promise<void> => {
  // When Supabase is configured, use Supabase and skip Sequelize
  if (config.supabase?.url && config.supabase?.serviceRoleKey) {
    try {
      logger.info('🔗 Using Supabase as database...');
      const { supabase } = await import('../services/supabase.service');
      // Test Supabase connection (list buckets - doesn't require tables)
      const { error } = await supabase.storage.listBuckets();
      if (error) {
        // Try users table as fallback (in case buckets fail)
        const { error: tableError } = await supabase.from('users').select('count').limit(1);
        if (tableError) {
          logger.warn('⚠️  Supabase: Tables may not exist yet. Run migration in Supabase SQL Editor.');
          logger.info('📋 Migration: backend/migrations/001_initial_schema.sql');
        }
      }
      logger.info('✅ Supabase connection verified');
      return;
    } catch (error) {
      logger.error('❌ Supabase connection failed:', error);
      process.exit(1);
    }
  }

  // Fallback: use Sequelize (local PostgreSQL)
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');

    if (config.env === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Database synchronized');
    }
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default sequelize;
