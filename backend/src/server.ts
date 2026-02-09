import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import 'express-async-errors';

import { config } from './config';
import { connectDatabase } from './config/database';
import { redisClient } from './config/redis';
import firebaseService from './services/firebase.service';
import logger from './utils/logger';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';

// Import models to ensure associations are set up
import './models';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(globalLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// API routes
app.use(`/api/${config.apiVersion}`, routes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    try {
      firebaseService.initialize();
    } catch (err) {
      logger.warn('Firebase init failed (optional for dev):', err);
    }

    // Connect to database
    await connectDatabase();

    // Test Redis connection
    await redisClient.ping();
    logger.info('✅ Redis connection verified');

    // Start listening
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📦 Environment: ${config.env}`);
      logger.info(`🔗 API Base URL: http://localhost:${config.port}/api/${config.apiVersion}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await redisClient.quit();
  process.exit(0);
});

startServer();

export default app;
