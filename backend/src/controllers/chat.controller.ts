import { Response } from 'express';
import { z } from 'zod';
import { Op } from 'sequelize';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import Notification, { NotificationType } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import pusherService from '../services/pusher.service';

const sendMessageSchema = z.object({
  receiver_id: z.string().uuid(),
  content: z.string().min(1),
  image_url: z.string().url().optional(),
});

export class ChatController {
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = sendMessageSchema.parse(req.body);

    // Check if receiver exists
    const receiver = await User.findByPk(data.receiver_id);
    if (!receiver) {
      throw new AppError('Receiver not found', 404);
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1_id: userId, user2_id: data.receiver_id },
          { user1_id: data.receiver_id, user2_id: userId },
        ],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        user1_id: userId,
        user2_id: data.receiver_id,
        last_message: data.content,
        last_message_at: new Date(),
      });
    } else {
      conversation.last_message = data.content;
      conversation.last_message_at = new Date();
      await conversation.save();
    }

    // Create message
    const message = await Message.create({
      conversation_id: conversation.id,
      sender_id: userId,
      receiver_id: data.receiver_id,
      content: data.content,
      image_url: data.image_url,
    });

    // Send via Pusher
    await pusherService.sendMessage(conversation.id, {
      id: message.id,
      sender_id: userId,
      receiver_id: data.receiver_id,
      content: data.content,
      image_url: data.image_url,
      created_at: message.created_at,
    });

    // Create notification for receiver
    const notification = await Notification.create({
      user_id: data.receiver_id,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      message: `You have a new message from ${req.user!.phone}`,
      data: {
        conversation_id: conversation.id,
        sender_id: userId,
      },
    });

    await pusherService.sendNotification(data.receiver_id, notification.toJSON());

    // Invalidate cache
    await RedisCache.del(`conversations:${userId}`);
    await RedisCache.del(`conversations:${data.receiver_id}`);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message.toJSON(),
    });
  }

  async getConversations(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    // Try cache first
    const cacheKey = `conversations:${userId}`;
    let conversations = await RedisCache.get<Conversation[]>(cacheKey);

    if (!conversations) {
      const dbConversations = await Conversation.findAll({
        where: {
          [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
        },
        include: [
          { model: User, as: 'user1', attributes: ['id', 'name', 'avatar_url'] },
          { model: User, as: 'user2', attributes: ['id', 'name', 'avatar_url'] },
        ],
        order: [['last_message_at', 'DESC']],
      });

      conversations = dbConversations.map((c: any) => {
        const conv = c.toJSON();
        // Return the other user
        conv.other_user = conv.user1_id === userId ? conv.user2 : conv.user1;
        return conv;
      });

      await RedisCache.set(cacheKey, conversations, 300); // 5 minutes
    }

    res.json({ conversations });
  }

  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Verify user is part of conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new AppError('Unauthorized access to conversation', 403);
    }

    const messages = await Message.findAll({
      where: { conversation_id: conversationId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar_url'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const total = await Message.count({ where: { conversation_id: conversationId } });

    // Mark messages as read
    await Message.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          conversation_id: conversationId,
          receiver_id: userId,
          is_read: false,
        },
      }
    );

    res.json({
      messages: messages.map((m: any) => m.toJSON()),
      total,
    });
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { messageId } = req.params;

    const message = await Message.findByPk(messageId);
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.receiver_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    message.is_read = true;
    message.read_at = new Date();
    await message.save();

    // Notify sender via Pusher
    await pusherService.markMessageAsRead(message.conversation_id, messageId, userId);

    res.json({ message: 'Message marked as read' });
  }

  async sendTypingIndicator(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { is_typing } = req.body;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await pusherService.sendTypingIndicator(conversationId, userId, is_typing);

    res.json({ message: 'Typing indicator sent' });
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const count = await Message.count({
      where: {
        receiver_id: userId,
        is_read: false,
      },
    });

    res.json({ unread_count: count });
  }
}

export default new ChatController();
