import admin from 'firebase-admin';
import { config } from '../config';
import logger from '../utils/logger';

class FirebaseService {
  private app: admin.app.App | null = null;
  private initialized = false;

  initialize(): void {
    if (this.app) return;
    const hasCreds = config.firebase.projectId && config.firebase.privateKey && config.firebase.clientEmail;
    if (!hasCreds) {
      logger.warn('Firebase credentials missing; skipping Firebase Admin init');
      return;
    }
    try {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey,
          clientEmail: config.firebase.clientEmail,
        }),
        databaseURL: config.firebase.databaseURL,
      });
      this.initialized = true;
      logger.info('✅ Firebase Admin initialized');
    } catch (error) {
      logger.error('❌ Firebase Admin initialization error:', error);
      throw error;
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.initialized || !this.app) {
      throw new Error('Firebase is not initialized');
    }
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      logger.error('Firebase ID token verification error:', error);
      throw new Error('Invalid Firebase token');
    }
  }

  async createCustomToken(uid: string): Promise<string> {
    if (!this.initialized || !this.app) throw new Error('Firebase is not initialized');
    try {
      return await admin.auth().createCustomToken(uid);
    } catch (error) {
      logger.error('Firebase custom token creation error:', error);
      throw new Error('Failed to create custom token');
    }
  }

  async sendNotification(
    token: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<void> {
    try {
      await admin.messaging().send({
        token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        android: {
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Firebase notification send error:', error);
    }
  }

  async sendMulticastNotification(
    tokens: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<void> {
    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
      });
    } catch (error) {
      logger.error('Firebase multicast notification error:', error);
    }
  }
}

export default new FirebaseService();
