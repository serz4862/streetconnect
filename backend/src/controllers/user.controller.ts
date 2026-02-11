import { Response } from 'express';
import { z } from 'zod';
import { UserRole } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { supabase } from '../services/supabase.service';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
  role: z.nativeEnum(UserRole).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location_name: z.string().optional(),
  onboarding_completed: z.boolean().optional(),
});

const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export class UserController {
  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const role = req.query.role as string;

    let query = supabase
      .from('users')
      .select('id, name, phone, role, avatar_url, city, location_name, is_verified', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,location_name.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new AppError(`Failed to fetch users: ${error.message}`, 500);
    }

    res.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    // Try cache first
    let user: any = await RedisCache.get(`user:${userId}`);

    if (!user) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        throw new AppError('User not found', 404);
      }
      user = data;
      await RedisCache.set(`user:${userId}`, user, 3600);
    }

    res.json({ user });
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = updateProfileSchema.parse(req.body);

    const { data: user, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error || !user) {
      throw new AppError('Failed to update profile', 500);
    }

    // Update cache
    await RedisCache.set(`user:${userId}`, user, 3600);

    // Update geolocation if changed
    if (data.latitude && data.longitude) {
      await RedisCache.geoadd('users:locations', data.longitude, data.latitude, userId);
    }

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  }

  async updateRole(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = updateRoleSchema.parse(req.body);

    const { data: user, error } = await supabase
      .from('users')
      .update({ role: data.role })
      .eq('id', userId)
      .select()
      .single();

    if (error || !user) {
      throw new AppError('Failed to update role', 500);
    }

    // Update cache
    await RedisCache.set(`user:${userId}`, user, 3600);

    res.json({
      message: 'Role updated successfully',
      user,
    });
  }

  async completeOnboarding(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const { data: user, error } = await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', userId)
      .select()
      .single();

    if (error || !user) {
      throw new AppError('Failed to complete onboarding', 500);
    }

    // Update cache
    await RedisCache.set(`user:${userId}`, user, 3600);

    res.json({
      message: 'Onboarding completed successfully',
      user,
    });
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    // Try cache first
    let user: any = await RedisCache.get(`user:${id}`);

    if (!user) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, role, city, created_at')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        throw new AppError('User not found', 404);
      }
      
      user = data;
      await RedisCache.set(`user:${id}`, user, 3600);
    }

    res.json({ user });
  }

  async getNearbyUsers(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const radius = parseInt(req.query.radius as string) || 5; // Default 5km

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('latitude, longitude')
      .eq('id', userId)
      .single();

    if (userError || !user || !user.latitude || !user.longitude) {
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
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, avatar_url, role, city, latitude, longitude')
      .in('id', nearbyUserIds)
      .eq('is_active', true);

    if (error) {
      throw new AppError('Failed to fetch nearby users', 500);
    }

    res.json({ users: users || [] });
  }

  async updateLocation(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { latitude, longitude, location_name } = req.body;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude required', 400);
    }

    const updates: any = { latitude, longitude };
    if (location_name) {
      updates.location_name = location_name;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error || !user) {
      throw new AppError('Failed to update location', 500);
    }

    // Update cache
    await RedisCache.set(`user:${userId}`, user, 3600);

    // Update geolocation
    await RedisCache.geoadd('users:locations', longitude, latitude, userId);

    res.json({ message: 'Location updated successfully' });
  }
}

export default new UserController();
