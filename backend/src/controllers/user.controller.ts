import { Response } from 'express';
import { z } from 'zod';
import User, { UserRole } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location_name: z.string().optional(),
});

const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export class UserController {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    // Try cache first
    let user: any = await RedisCache.get(`user:${userId}`);

    if (!user) {
      const dbUser = await User.findByPk(userId);
      if (!dbUser) {
        throw new AppError('User not found', 404);
      }
      user = dbUser.toJSON();
      await RedisCache.set(`user:${userId}`, user, 3600);
    }

    res.json({ user });
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = updateProfileSchema.parse(req.body);

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update fields
    Object.assign(user, data);
    await user.save();

    // Update cache
    await RedisCache.set(`user:${userId}`, user.toJSON(), 3600);

    // Update geolocation if changed
    if (data.latitude && data.longitude) {
      await RedisCache.geoadd('users:locations', data.longitude, data.latitude, userId);
    }

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  }

  async updateRole(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = updateRoleSchema.parse(req.body);

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.role = data.role;
    await user.save();

    // Update cache
    await RedisCache.set(`user:${userId}`, user.toJSON(), 3600);

    res.json({
      message: 'Role updated successfully',
      user: user.toJSON(),
    });
  }

  async completeOnboarding(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.onboarding_completed = true;
    await user.save();

    // Update cache
    await RedisCache.set(`user:${userId}`, user.toJSON(), 3600);

    res.json({
      message: 'Onboarding completed successfully',
      user: user.toJSON(),
    });
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    // Try cache first
    let user: any = await RedisCache.get(`user:${id}`);

    if (!user) {
      const dbUser = await User.findByPk(id, {
        attributes: ['id', 'name', 'avatar_url', 'role', 'city', 'created_at'],
      });
      
      if (!dbUser) {
        throw new AppError('User not found', 404);
      }
      
      user = dbUser.toJSON();
      await RedisCache.set(`user:${id}`, user, 3600);
    }

    res.json({ user });
  }

  async getNearbyUsers(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const radius = parseInt(req.query.radius as string) || 5; // Default 5km

    const user = await User.findByPk(userId);
    if (!user || !user.latitude || !user.longitude) {
      throw new AppError('User location not found', 404);
    }

    // Get nearby user IDs from Redis
    const nearbyUserIds = await RedisCache.georadius(
      'users:locations',
      user.longitude,
      user.latitude,
      radius,
      'km'
    );

    // Fetch user details
    const users = await User.findAll({
      where: {
        id: nearbyUserIds,
        is_active: true,
      },
      attributes: ['id', 'name', 'avatar_url', 'role', 'city', 'latitude', 'longitude'],
    });

    res.json({ users });
  }

  async updateLocation(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { latitude, longitude, location_name } = req.body;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude required', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.latitude = latitude;
    user.longitude = longitude;
    if (location_name) {
      user.location_name = location_name;
    }
    await user.save();

    // Update cache
    await RedisCache.set(`user:${userId}`, user.toJSON(), 3600);

    // Update geolocation
    await RedisCache.geoadd('users:locations', longitude, latitude, userId);

    res.json({ message: 'Location updated successfully' });
  }
}

export default new UserController();
