import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { supabase } from '../services/supabase.service';

const saveLocationSchema = z.object({
  label: z.string().min(1).max(100),
  latitude: z.number(),
  longitude: z.number(),
  location_name: z.string().max(200).optional(),
  is_default: z.boolean().optional(),
});

const updateLocationSchema = saveLocationSchema.partial();

export class LocationController {
  async listLocations(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { data, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new AppError(`Failed to fetch locations: ${error.message}`, 500);
    res.json({ locations: data ?? [] });
  }

  async saveLocation(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = saveLocationSchema.parse(req.body);

    // Max 10 saved locations per user
    const { count } = await supabase
      .from('user_locations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((count ?? 0) >= 10) {
      throw new AppError('You can save up to 10 locations. Please delete one first.', 400);
    }

    // If this is marked default, clear existing defaults first
    if (data.is_default) {
      await supabase
        .from('user_locations')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data: location, error } = await supabase
      .from('user_locations')
      .insert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) throw new AppError(`Failed to save location: ${error.message}`, 500);
    res.status(201).json({ message: 'Location saved', location });
  }

  async updateLocation(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = updateLocationSchema.parse(req.body);

    // If setting default, clear other defaults
    if (data.is_default) {
      await supabase
        .from('user_locations')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data: location, error } = await supabase
      .from('user_locations')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !location) throw new AppError('Location not found', 404);
    res.json({ message: 'Location updated', location });
  }

  async deleteLocation(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('user_locations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new AppError(`Failed to delete location: ${error.message}`, 500);
    res.json({ message: 'Location deleted' });
  }

  async setDefault(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    // Clear all defaults
    await supabase
      .from('user_locations')
      .update({ is_default: false })
      .eq('user_id', userId);

    const { data: location, error } = await supabase
      .from('user_locations')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !location) throw new AppError('Location not found', 404);
    res.json({ message: 'Default location updated', location });
  }
}

export default new LocationController();
