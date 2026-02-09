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
