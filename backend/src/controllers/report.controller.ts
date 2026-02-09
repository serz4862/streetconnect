import { Response } from 'express';
import { z } from 'zod';
import Report, { ReportType, ReportStatus } from '../models/Report';
import Dog from '../models/Dog';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';

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

    // Verify dog exists if dog_id provided
    if (data.dog_id) {
      const dog = await Dog.findByPk(data.dog_id);
      if (!dog) {
        throw new AppError('Dog not found', 404);
      }
    }

    const report = await Report.create({
      ...data,
      user_id: userId,
    });

    // Update dog status if applicable
    if (data.dog_id && data.type === ReportType.LOST) {
      await Dog.update({ is_lost: true }, { where: { id: data.dog_id } });
      await RedisCache.del(`dog:${data.dog_id}`);
    } else if (data.dog_id && data.type === ReportType.FOUND) {
      await Dog.update({ is_found: true, is_lost: false }, { where: { id: data.dog_id } });
      await RedisCache.del(`dog:${data.dog_id}`);
    }

    // Add to geolocation cache for map view
    await RedisCache.geoadd('reports:locations', data.longitude, data.latitude, report.id);

    res.status(201).json({
      message: 'Report created successfully',
      report: report.toJSON(),
    });
  }

  async getReportById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const report = await Report.findByPk(id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'avatar_url', 'phone'] },
        { model: Dog, as: 'dog' },
        { model: User, as: 'resolver', attributes: ['id', 'name', 'avatar_url'] },
      ],
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    res.json({ report: report.toJSON() });
  }

  async updateReport(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = updateReportSchema.parse(req.body);

    const report = await Report.findByPk(id);
    if (!report) {
      throw new AppError('Report not found', 404);
    }

    // Only reporter or admin can update
    if (report.user_id !== userId) {
      throw new AppError('Unauthorized to update this report', 403);
    }

    Object.assign(report, data);

    if (data.status === ReportStatus.RESOLVED) {
      report.resolved_by = userId;
      report.resolved_at = new Date();
    }

    await report.save();

    res.json({
      message: 'Report updated successfully',
      report: report.toJSON(),
    });
  }

  async getNearbyReports(req: AuthRequest, res: Response): Promise<void> {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radius = parseInt(req.query.radius as string) || 5; // Default 5km
    const type = req.query.type as ReportType | undefined;
    const status = req.query.status as ReportStatus | undefined;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude required', 400);
    }

    // Get nearby report IDs from Redis
    const nearbyReportIds = await RedisCache.georadius(
      'reports:locations',
      longitude,
      latitude,
      radius,
      'km'
    );

    if (nearbyReportIds.length === 0) {
      res.json({ reports: [], total: 0 });
      return;
    }

    // Build query filters
    const where: any = {
      id: nearbyReportIds,
    };

    if (type) where.type = type;
    if (status) where.status = status;

    const reports = await Report.findAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'avatar_url'] },
        { model: Dog, as: 'dog', attributes: ['id', 'name', 'color', 'image_url'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      reports: reports.map((r: any) => r.toJSON()),
      total: reports.length,
    });
  }

  async getMyReports(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const reports = await Report.findAll({
      where: { user_id: userId },
      include: [{ model: Dog, as: 'dog', attributes: ['id', 'name', 'color', 'image_url'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const total = await Report.count({ where: { user_id: userId } });

    res.json({
      reports: reports.map((r: any) => r.toJSON()),
      total,
    });
  }

  async getDogReports(req: AuthRequest, res: Response): Promise<void> {
    const { dogId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const reports = await Report.findAll({
      where: { dog_id: dogId },
      include: [{ model: User, as: 'reporter', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const total = await Report.count({ where: { dog_id: dogId } });

    res.json({
      reports: reports.map((r: any) => r.toJSON()),
      total,
    });
  }

  async deleteReport(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const report = await Report.findByPk(id);
    if (!report) {
      throw new AppError('Report not found', 404);
    }

    if (report.user_id !== userId) {
      throw new AppError('Unauthorized to delete this report', 403);
    }

    await report.destroy();

    res.json({ message: 'Report deleted successfully' });
  }
}

export default new ReportController();
