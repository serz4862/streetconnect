import { Response } from 'express';
import { z } from 'zod';
import { ReportType, ReportStatus } from '../models/Report';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { supabase } from '../services/supabase.service';

const createReportSchema = z.object({
  dog_id: z.string().uuid().optional(),
  type: z.nativeEnum(ReportType),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  latitude: z.number(),
  longitude: z.number(),
  location_name: z.string().optional(),
});

const updateReportSchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export class ReportController {
  async createReport(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = createReportSchema.parse(req.body);

    if (data.dog_id) {
      const { data: dog } = await supabase.from('dogs').select('id').eq('id', data.dog_id).single();
      if (!dog) {
        throw new AppError('Dog not found', 404);
      }
    }

    const { data: report, error } = await supabase
      .from('reports')
      .insert({ ...data, user_id: userId, status: 'pending' })
      .select()
      .single();

    if (error || !report) {
      throw new AppError(`Failed to create report: ${error?.message}`, 500);
    }

    if (data.dog_id) {
      if (data.type === ReportType.LOST) {
        await supabase.from('dogs').update({ is_lost: true }).eq('id', data.dog_id);
      } else if (data.type === ReportType.FOUND) {
        await supabase.from('dogs').update({ is_found: true, is_lost: false }).eq('id', data.dog_id);
      }
      await RedisCache.del(`dog:${data.dog_id}`);
    }

    await RedisCache.geoadd('reports:locations', data.longitude, data.latitude, report.id);

    res.status(201).json({
      message: 'Report created successfully',
      report,
    });
  }

  async getReportById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const { data: report, error } = await supabase.from('reports').select('*').eq('id', id).single();
    if (error || !report) {
      throw new AppError('Report not found', 404);
    }

    const [reporter, dog, resolver] = await Promise.all([
      supabase.from('users').select('id, name, avatar_url, phone').eq('id', report.user_id).single(),
      report.dog_id ? supabase.from('dogs').select('*').eq('id', report.dog_id).single() : Promise.resolve({ data: null }),
      report.resolved_by ? supabase.from('users').select('id, name, avatar_url').eq('id', report.resolved_by).single() : Promise.resolve({ data: null }),
    ]);

    res.json({
      report: {
        ...report,
        reporter: reporter.data,
        dog: dog.data,
        resolver: resolver.data,
      },
    });
  }

  async updateReport(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = updateReportSchema.parse(req.body);

    const { data: report, error } = await supabase.from('reports').select('*').eq('id', id).single();
    if (error || !report) {
      throw new AppError('Report not found', 404);
    }

    if (report.user_id !== userId) {
      throw new AppError('Unauthorized to update this report', 403);
    }

    const updates: any = { ...data };
    if (data.status === ReportStatus.RESOLVED) {
      updates.resolved_by = userId;
      updates.resolved_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new AppError(`Failed to update: ${updateError.message}`, 500);
    }

    res.json({
      message: 'Report updated successfully',
      report: updated,
    });
  }

  async getNearbyReports(req: AuthRequest, res: Response): Promise<void> {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radius = parseInt(req.query.radius as string) || 5;
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude required', 400);
    }

    const deg = radius / 111;
    const latMin = latitude - deg;
    const latMax = latitude + deg;
    const lngMin = longitude - deg / Math.cos((latitude * Math.PI) / 180);
    const lngMax = longitude + deg / Math.cos((latitude * Math.PI) / 180);

    let query = supabase
      .from('reports')
      .select('*')
      .gte('latitude', latMin)
      .lte('latitude', latMax)
      .gte('longitude', lngMin)
      .lte('longitude', lngMax)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data: reports, error } = await query;

    if (error) {
      throw new AppError(`Failed to fetch reports: ${error.message}`, 500);
    }

    const reportList = reports || [];
    if (reportList.length) {
      const userIds = [...new Set(reportList.map((r: any) => r.user_id))];
      const dogIds = [...new Set(reportList.map((r: any) => r.dog_id).filter(Boolean))];
      const [users, dogs] = await Promise.all([
        supabase.from('users').select('id, name, avatar_url').in('id', userIds),
        dogIds.length ? supabase.from('dogs').select('id, name, color, image_url').in('id', dogIds) : { data: [] },
      ]);
      const userMap = (users.data || []).reduce((acc: any, u) => { acc[u.id] = u; return acc; }, {});
      const dogMap = (dogs.data || []).reduce((acc: any, d) => { acc[d.id] = d; return acc; }, {});
      const enriched = reportList.map((r: any) => ({
        ...r,
        reporter: userMap[r.user_id],
        dog: r.dog_id ? dogMap[r.dog_id] : null,
      }));

      res.json({ reports: enriched, total: enriched.length });
    } else {
      res.json({ reports: [], total: 0 });
    }
  }

  async getMyReports(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { count } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    if (error) {
      throw new AppError(`Failed to fetch reports: ${error.message}`, 500);
    }

    const reportList = reports || [];
    const dogIds = reportList.map((r: any) => r.dog_id).filter(Boolean);
    const dogs = dogIds.length ? await supabase.from('dogs').select('id, name, color, image_url').in('id', dogIds) : { data: [] };
    const dogMap = (dogs.data || []).reduce((acc: any, d) => { acc[d.id] = d; return acc; }, {});

    res.json({
      reports: reportList.map((r: any) => ({ ...r, dog: r.dog_id ? dogMap[r.dog_id] : null })),
      total: count ?? 0,
    });
  }

  async getDogReports(req: AuthRequest, res: Response): Promise<void> {
    const { dogId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { count } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('dog_id', dogId);

    if (error) {
      throw new AppError(`Failed to fetch reports: ${error.message}`, 500);
    }

    const reportList = reports || [];
    const userIds = [...new Set(reportList.map((r: any) => r.user_id))];
    const { data: users } = await supabase.from('users').select('id, name, avatar_url').in('id', userIds);
    const userMap = (users || []).reduce((acc: any, u) => { acc[u.id] = u; return acc; }, {});

    res.json({
      reports: reportList.map((r: any) => ({ ...r, reporter: userMap[r.user_id] })),
      total: count ?? 0,
    });
  }

  async deleteReport(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: report } = await supabase.from('reports').select('user_id').eq('id', id).single();
    if (!report) {
      throw new AppError('Report not found', 404);
    }

    if (report.user_id !== userId) {
      throw new AppError('Unauthorized to delete this report', 403);
    }

    await supabase.from('reports').delete().eq('id', id);
    res.json({ message: 'Report deleted successfully' });
  }
}

export default new ReportController();
