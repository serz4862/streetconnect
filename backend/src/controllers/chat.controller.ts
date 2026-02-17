import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import pusherService from '../services/pusher.service';
import { supabase } from '../services/supabase.service';
import { NotificationType } from '../models/Notification';

const sendMessageSchema = z.object({
  receiver_id: z.string().uuid(),
  content: z.string().min(1),
  image_url: z.string().url().optional(),
});

export class ChatController {
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = sendMessageSchema.parse(req.body);

    const { data: receiver } = await supabase.from('users').select('id').eq('id', data.receiver_id).single();
    if (!receiver) {
      throw new AppError('Receiver not found', 404);
    }

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    let conversation = (convs || []).find(
      (c: any) =>
        (c.user1_id === userId && c.user2_id === data.receiver_id) ||
        (c.user1_id === data.receiver_id && c.user2_id === userId)
    );
    if (!conversation) {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: userId,
          user2_id: data.receiver_id,
          last_message: data.content,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !newConv) {
        throw new AppError(`Failed to create conversation: ${error?.message}`, 500);
      }
      conversation = newConv;
    } else {
      const { data: updated } = await supabase
        .from('conversations')
        .update({
          last_message: data.content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)
        .select()
        .single();
      conversation = updated || conversation;
    }

    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: userId,
        receiver_id: data.receiver_id,
        content: data.content,
        image_url: data.image_url,
      })
      .select()
      .single();

    if (msgError || !message) {
      throw new AppError(`Failed to send message: ${msgError?.message}`, 500);
    }

    try {
      await pusherService.sendMessage(conversation.id, {
        id: message.id,
        sender_id: userId,
        receiver_id: data.receiver_id,
        content: data.content,
        image_url: data.image_url,
        created_at: message.created_at,
      });
    } catch (_) {}

    await supabase.from('notifications').insert({
      user_id: data.receiver_id,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      message: `You have a new message from ${req.user!.phone}`,
      data: { conversation_id: conversation.id, sender_id: userId },
    });

    await RedisCache.del(`conversations:${userId}`);
    await RedisCache.del(`conversations:${data.receiver_id}`);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  }

  /** GET /chat/conversations/or-create?receiver_id=xxx - get or create conversation with a user, returns conversation + messages */
  async getOrCreateConversation(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const receiverId = req.query.receiver_id as string;
    if (!receiverId) {
      throw new AppError('receiver_id is required', 400);
    }

    const { data: receiver } = await supabase.from('users').select('id').eq('id', receiverId).single();
    if (!receiver) {
      throw new AppError('Receiver not found', 404);
    }

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    let conversation = (convs || []).find(
      (c: any) =>
        (c.user1_id === userId && c.user2_id === receiverId) ||
        (c.user1_id === receiverId && c.user2_id === userId)
    );

    if (!conversation) {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: userId,
          user2_id: receiverId,
          last_message: null,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error || !newConv) {
        throw new AppError(`Failed to create conversation: ${error?.message}`, 500);
      }
      conversation = newConv;
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({
      conversation_id: conversation.id,
      conversation,
      messages: messages || [],
    });
  }

  async getConversations(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const cacheKey = `conversations:${userId}`;
    let conversations = await RedisCache.get<any[]>(cacheKey);

    if (!conversations) {
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        throw new AppError(`Failed to fetch conversations: ${error.message}`, 500);
      }

      const list = convs || [];
      const userIds = [...new Set(list.flatMap((c: any) => [c.user1_id, c.user2_id]))];
      const { data: users } = await supabase.from('users').select('id, name, avatar_url').in('id', userIds);
      const userMap = (users || []).reduce((acc: any, u) => { acc[u.id] = u; return acc; }, {});

      conversations = list.map((c: any) => ({
        ...c,
        other_user: c.user1_id === userId ? userMap[c.user2_id] : userMap[c.user1_id],
      }));

      await RedisCache.set(cacheKey, conversations, 300);
    }

    res.json({ conversations });
  }

  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: conversation } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new AppError('Unauthorized access to conversation', 403);
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', conversationId);

    if (error) {
      throw new AppError(`Failed to fetch messages: ${error.message}`, 500);
    }

    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    const msgList = messages || [];
    const senderIds = [...new Set(msgList.map((m: any) => m.sender_id))];
    const { data: senders } = await supabase.from('users').select('id, name, avatar_url').in('id', senderIds);
    const senderMap = (senders || []).reduce((acc: any, s) => { acc[s.id] = s; return acc; }, {});

    res.json({
      messages: msgList.map((m: any) => ({ ...m, sender: senderMap[m.sender_id] })),
      total: count ?? 0,
    });
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { messageId } = req.params;

    const { data: message } = await supabase.from('messages').select('*').eq('id', messageId).single();
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.receiver_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);

    try {
      await pusherService.markMessageAsRead(message.conversation_id, messageId, userId);
    } catch (_) {}

    res.json({ message: 'Message marked as read' });
  }

  async sendTypingIndicator(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    const { data: conversation } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const { is_typing } = req.body;
    try {
      await pusherService.sendTypingIndicator(conversationId, userId, is_typing);
    } catch (_) {}

    res.json({ message: 'Typing indicator sent' });
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    res.json({ unread_count: count ?? 0 });
  }
}

export default new ChatController();
