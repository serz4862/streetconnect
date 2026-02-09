import { Response } from 'express';
import { z } from 'zod';
import FeedLog from '../models/FeedLog';
import Dog from '../models/Dog';
import User from '../models/User';
import DogCaretaker from '../models/DogCaretaker';
import Notification, { NotificationType } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import pusherService from '../services/pusher.service';

const createFeedLogSchema = z.object({
  dog_id: z.string().uuid(),
  notes: z.string().optional(),
  image_url: z.string().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export class FeedController {
  async logFeed(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = createFeedLogSchema.parse(req.body);

    const dog = await Dog.findByPk(data.dog_id);
    if (!dog) {
      throw new AppError('Dog not found', 404);
    }

    // Create feed log
    const feedLog = await FeedLog.create({
      dog_id: data.dog_id,
      user_id: userId,
      fed_at: new Date(),
      notes: data.notes,
      image_url: data.image_url,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    // Update dog's last_fed_at
    dog.last_fed_at = new Date();
    await dog.save();

    // Update cache
    await RedisCache.del(`dog:${data.dog_id}`);
    await RedisCache.del(`feed:dog:${data.dog_id}`);

    // Add to feed log list in Redis
    await RedisCache.lpush(`feed:logs:${data.dog_id}`, feedLog.toJSON(), 86400);

    res.status(201).json({
      message: 'Feed logged successfully',
      feed_log: feedLog.toJSON(),
    });
  }

  async getDogFeedHistory(req: AuthRequest, res: Response): Promise<void> {
    const { dogId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Try cache first (only for first page)
    if (offset === 0) {
      const cached = await RedisCache.lrange<FeedLog>(`feed:logs:${dogId}`, 0, limit - 1);
      if (cached.length > 0) {
        res.json({ feed_logs: cached, total: cached.length });
        return;
      }
    }

    const feedLogs = await FeedLog.findAll({
      where: { dog_id: dogId },
      include: [{ model: User, as: 'feeder', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['fed_at', 'DESC']],
      limit,
      offset,
    });

    const total = await FeedLog.count({ where: { dog_id: dogId } });

    res.json({
      feed_logs: feedLogs.map((f) => f.toJSON()),
      total,
    });
  }

  async getMyFeedLogs(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const feedLogs = await FeedLog.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Dog,
          as: 'dog',
          attributes: ['id', 'name', 'color', 'gender', 'image_url'],
        },
      ],
      order: [['fed_at', 'DESC']],
      limit,
      offset,
    });

    const total = await FeedLog.count({ where: { user_id: userId } });

    res.json({
      feed_logs: feedLogs.map((f) => f.toJSON()),
      total,
    });
  }

  async checkUnfedDogs(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    // Get user's dogs
    const caretakers = await DogCaretaker.findAll({
      where: { user_id: userId },
      include: [{ model: Dog, as: 'dog' }],
    });

    const unfedDogs = [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const caretaker of caretakers as any[]) {
      const dog = caretaker.dog;
      if (!dog.last_fed_at || new Date(dog.last_fed_at) < twentyFourHoursAgo) {
        unfedDogs.push({
          id: dog.id,
          name: dog.name,
          color: dog.color,
          last_fed_at: dog.last_fed_at,
        });
      }
    }

    res.json({
      unfed_dogs: unfedDogs,
      total: unfedDogs.length,
    });
  }

  async sendFeedReminders(_req: AuthRequest, res: Response): Promise<void> {
    // This should be called by a cron job, but can also be triggered manually

    // Find all dogs not fed in 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const unfedDogs = await Dog.findAll({
      where: {
        last_fed_at: {
          $lt: twentyFourHoursAgo,
        },
      },
      include: [
        {
          model: User,
          as: 'caretakers',
          through: { attributes: ['caretaker_type'] },
        },
      ],
    });

    for (const dog of unfedDogs as any[]) {
      for (const caretaker of dog.caretakers) {
        // Create notification
        const notification = await Notification.create({
          user_id: caretaker.id,
          type: NotificationType.DOG_NOT_FED,
          title: 'Feed Reminder',
          message: `${dog.name || 'Dog'} hasn't been fed in 24 hours`,
          data: {
            dog_id: dog.id,
            dog_name: dog.name,
          },
        });

        // Send via Pusher
        await pusherService.sendNotification(caretaker.id, notification.toJSON());
      }
    }

    res.json({ message: 'Feed reminders sent', count: unfedDogs.length });
  }
}

export default new FeedController();
