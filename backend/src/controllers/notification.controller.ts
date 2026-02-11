import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { supabase } from '../services/supabase.service';

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const unread_only = req.query.unread_only === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    let totalQuery = supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (unread_only) totalQuery = totalQuery.eq('is_read', false);
    const { count: total } = await totalQuery;

    const { count: unread_count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new AppError(`Failed to fetch notifications: ${error.message}`, 500);
    }

    res.json({
      notifications: notifications || [],
      total: total ?? 0,
      unread_count: unread_count ?? 0,
    });
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: notification } = await supabase.from('notifications').select('*').eq('id', id).single();
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.user_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const { data: updated } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    res.json({
      message: 'Notification marked as read',
      notification: updated,
    });
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    res.json({ message: 'All notifications marked as read' });
  }

  async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: notification } = await supabase.from('notifications').select('user_id').eq('id', id).single();
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.user_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await supabase.from('notifications').delete().eq('id', id);
    res.json({ message: 'Notification deleted successfully' });
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    res.json({ unread_count: count ?? 0 });
  }
}

export default new NotificationController();
