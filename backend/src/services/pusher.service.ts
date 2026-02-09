import Pusher from 'pusher';
import { config } from '../config';
import logger from '../utils/logger';

class PusherService {
  private pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: config.pusher.appId,
      key: config.pusher.key,
      secret: config.pusher.secret,
      cluster: config.pusher.cluster,
      useTLS: true,
    });
  }

  async sendMessage(
    conversationId: string,
    message: {
      id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      image_url?: string;
      created_at: Date;
    }
  ): Promise<void> {
    try {
      await this.pusher.trigger(`conversation-${conversationId}`, 'new-message', message);
    } catch (error) {
      logger.error('Pusher send message error:', error);
    }
  }

  async sendTypingIndicator(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      await this.pusher.trigger(`conversation-${conversationId}`, 'typing', {
        user_id: userId,
        is_typing: isTyping,
      });
    } catch (error) {
      logger.error('Pusher typing indicator error:', error);
    }
  }

  async markMessageAsRead(
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      await this.pusher.trigger(`conversation-${conversationId}`, 'message-read', {
        message_id: messageId,
        user_id: userId,
      });
    } catch (error) {
      logger.error('Pusher message read error:', error);
    }
  }

  async sendNotification(
    userId: string,
    notification: {
      id: string;
      type: string;
      title: string;
      message: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      await this.pusher.trigger(`user-${userId}`, 'notification', notification);
    } catch (error) {
      logger.error('Pusher notification error:', error);
    }
  }

  async authenticateUser(socketId: string, channel: string, userId: string): Promise<any> {
    try {
      return this.pusher.authorizeChannel(socketId, channel, {
        user_id: userId,
      });
    } catch (error) {
      logger.error('Pusher authentication error:', error);
      throw error;
    }
  }
}

export default new PusherService();
