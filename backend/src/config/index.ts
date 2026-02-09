import dotenv from 'dotenv';

dotenv.config();

interface Config {
  env: string;
  port: number;
  apiVersion: string;
  database: {
    url: string;
    pool: {
      max: number;
      min: number;
    };
  };
  redis: {
    url: string;
    ttl: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  firebase: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
    databaseURL: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
    s3Url: string;
  };
  pusher: {
    appId: string;
    key: string;
    secret: string;
    cluster: string;
  };
  googleMaps: {
    apiKey: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string[];
  };
  logging: {
    level: string;
  };
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  database: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/streetconnect_db',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
    },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || 'streetconnect-uploads',
    s3Url: process.env.AWS_S3_URL || '',
  },
  pusher: {
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || 'ap2',
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:8081').split(','),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};
