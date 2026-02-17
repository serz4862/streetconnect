import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import pusherService from '../services/pusher.service';
import { NotificationType } from '../models/Notification';
import { supabase } from '../services/supabase.service';

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

    const { data: dog } = await supabase.from('dogs').select('id').eq('id', data.dog_id).single();
    if (!dog) {
      throw new AppError('Dog not found', 404);
    }

    const { data: feedLog, error } = await supabase
      .from('feed_logs')
      .insert({
        dog_id: data.dog_id,
        user_id: userId,
        fed_at: new Date().toISOString(),
        notes: data.notes,
        image_url: data.image_url,
        latitude: data.latitude,
        longitude: data.longitude,
      })
      .select()
      .single();

    if (error || !feedLog) {
      throw new AppError(`Failed to log feed: ${error?.message}`, 500);
    }

    await supabase
      .from('dogs')
      .update({ last_fed_at: new Date().toISOString() })
      .eq('id', data.dog_id);

    await RedisCache.del(`dog:${data.dog_id}`);
    await RedisCache.del(`feed:dog:${data.dog_id}`);

    res.status(201).json({
      message: 'Feed logged successfully',
      feed_log: feedLog,
    });
  }

  async getDogFeedHistory(req: AuthRequest, res: Response): Promise<void> {
    const { dogId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: feedLogs, error } = await supabase
      .from('feed_logs')
      .select('*')
      .eq('dog_id', dogId)
      .order('fed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { count } = await supabase.from('feed_logs').select('*', { count: 'exact', head: true }).eq('dog_id', dogId);

    if (error) {
      throw new AppError(`Failed to fetch feed logs: ${error.message}`, 500);
    }

    const logs = feedLogs || [];
    const userIds = [...new Set(logs.map((f: any) => f.user_id))];
    const { data: users } = await supabase.from('users').select('id, name, avatar_url').in('id', userIds);
    const userMap = (users || []).reduce((acc: any, u) => { acc[u.id] = u; return acc; }, {});

    res.json({
      feed_logs: logs.map((f: any) => ({ ...f, feeder: userMap[f.user_id] })),
      total: count ?? 0,
    });
  }

  async getMyFeedLogs(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: feedLogs, error } = await supabase
      .from('feed_logs')
      .select('*')
      .eq('user_id', userId)
      .order('fed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { count } = await supabase.from('feed_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    if (error) {
      throw new AppError(`Failed to fetch feed logs: ${error.message}`, 500);
    }

    const logs = feedLogs || [];
    const dogIds = [...new Set(logs.map((f: any) => f.dog_id))];
    const { data: dogs } = await supabase.from('dogs').select('id, name, color, gender, image_url').in('id', dogIds);
    const dogMap = (dogs || []).reduce((acc: any, d) => { acc[d.id] = d; return acc; }, {});

    res.json({
      feed_logs: logs.map((f: any) => ({ ...f, dog: dogMap[f.dog_id] })),
      total: count ?? 0,
    });
  }

  async checkUnfedDogs(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: caretakers } = await supabase
      .from('dog_caretakers')
      .select('dog_id')
      .eq('user_id', userId);

    if (!caretakers?.length) {
      res.json({ unfed_dogs: [], total: 0 });
      return;
    }

    const dogIds = caretakers.map((c: any) => c.dog_id);
    const { data: dogs } = await supabase
      .from('dogs')
      .select('id, name, color, last_fed_at')
      .in('id', dogIds);

    const unfedDogs = (dogs || []).filter((d: any) => !d.last_fed_at || d.last_fed_at < twentyFourHoursAgo);

    res.json({
      unfed_dogs: unfedDogs.map((d: any) => ({ id: d.id, name: d.name, color: d.color, last_fed_at: d.last_fed_at })),
      total: unfedDogs.length,
    });
  }

  async sendFeedReminders(_req: AuthRequest, res: Response): Promise<void> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: unfedDogs } = await supabase
      .from('dogs')
      .select('id, name')
      .or(`last_fed_at.lt.${twentyFourHoursAgo},last_fed_at.is.null`);

    if (!unfedDogs?.length) {
      res.json({ message: 'Feed reminders sent', count: 0 });
      return;
    }

    const dogIds = unfedDogs.map((d: any) => d.id);
    const { data: caretakers } = await supabase
      .from('dog_caretakers')
      .select('user_id, dog_id')
      .in('dog_id', dogIds);

    const dogMap = unfedDogs.reduce((acc: any, d) => { acc[d.id] = d; return acc; }, {});

    for (const ct of caretakers || []) {
      const dog = dogMap[ct.dog_id];
      const { data: notif } = await supabase
        .from('notifications')
        .insert({
          user_id: ct.user_id,
          type: NotificationType.DOG_NOT_FED,
          title: 'Feed Reminder',
          message: `${dog?.name || 'Dog'} hasn't been fed in 24 hours`,
          data: { dog_id: dog?.id, dog_name: dog?.name },
        })
        .select()
        .single();

      if (notif) {
        try {
          await pusherService.sendNotification(ct.user_id, notif);
        } catch (_) {}
      }
    }

    res.json({ message: 'Feed reminders sent', count: unfedDogs.length });
  }
}

export default new FeedController();
