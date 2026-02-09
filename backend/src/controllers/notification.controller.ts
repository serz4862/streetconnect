import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const unread_only = req.query.unread_only === 'true';

    const where: any = { user_id: userId };
    if (unread_only) {
      where.is_read = false;
    }

    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const total = await Notification.count({ where });
    const unread_count = await Notification.count({
      where: { user_id: userId, is_read: false },
    });

    res.json({
      notifications: notifications.map((n: any) => n.toJSON()),
      total,
      unread_count,
    });
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.user_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    res.json({
      message: 'Notification marked as read',
      notification: notification.toJSON(),
    });
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } }
    );

    res.json({ message: 'All notifications marked as read' });
  }

  async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.user_id !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await notification.destroy();

    res.json({ message: 'Notification deleted successfully' });
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const count = await Notification.count({
      where: { user_id: userId, is_read: false },
    });

    res.json({ unread_count: count });
  }
}

export default new NotificationController();
