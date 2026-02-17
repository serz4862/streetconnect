import { Response } from 'express';
import { z } from 'zod';
import { DogGender, DogHealthStatus } from '../models/Dog';
import { CaretakerType } from '../models/DogCaretaker';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import qrcodeService from '../services/qrcode.service';
import pdfService from '../services/pdf.service';
import { supabase } from '../services/supabase.service';

const createDogSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  gender: z.nativeEnum(DogGender),
  breed: z.string().optional(),
  age_approx: z.number().min(0).max(30).optional(),
  is_sterilized: z.boolean().optional(),
  health_status: z.nativeEnum(DogHealthStatus).optional(),
  health_notes: z.string().optional(),
  image_url: z.string().url().optional(),
  latitude: z.number(),
  longitude: z.number(),
  location_name: z.string().optional(),
  description: z.string().optional(),
  caretaker_type: z.nativeEnum(CaretakerType).optional(),
});

const updateDogSchema = createDogSchema.partial();

// Approximate degrees for radius (1 deg lat ≈ 111km, 5km ≈ 0.045)
function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const deg = radiusKm / 111;
  return {
    latMin: lat - deg,
    latMax: lat + deg,
    lngMin: lng - deg / Math.cos((lat * Math.PI) / 180),
    lngMax: lng + deg / Math.cos((lat * Math.PI) / 180),
  };
}

export class DogController {
  async createDog(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = createDogSchema.parse(req.body);

    const { data: dog, error: createError } = await supabase
      .from('dogs')
      .insert({
        ...data,
        created_by: userId,
        last_seen_at: new Date().toISOString(),
        is_sterilized: data.is_sterilized ?? false,
        health_status: data.health_status ?? 'unknown',
        is_lost: false,
        is_found: false,
      })
      .select()
      .single();

    if (createError || !dog) {
      throw new AppError(`Failed to create dog: ${createError?.message}`, 500);
    }

    // Generate QR code
    const { qrCodeUrl, qrCodeId } = await qrcodeService.generateDogQRCode(dog.id);
    const { error: updateError } = await supabase
      .from('dogs')
      .update({ qr_code_url: qrCodeUrl, qr_code_id: qrCodeId })
      .eq('id', dog.id);

    if (updateError) {
      throw new AppError(`Failed to save QR code: ${updateError.message}`, 500);
    }

    // Add creator as caretaker if specified
    if (data.caretaker_type) {
      await supabase.from('dog_caretakers').insert({
        dog_id: dog.id,
        user_id: userId,
        caretaker_type: data.caretaker_type,
        is_primary: true,
      });
    }

    await RedisCache.geoadd('dogs:locations', data.longitude, data.latitude, dog.id);
    await RedisCache.set(`dog:${dog.id}`, { ...dog, qr_code_url: qrCodeUrl, qr_code_id: qrCodeId }, 3600);
    await RedisCache.delPattern('dogs:nearby:*');

    const finalDog = { ...dog, qr_code_url: qrCodeUrl, qr_code_id: qrCodeId };
    res.status(201).json({
      message: 'Dog created successfully',
      dog: finalDog,
    });
  }

  async getDogById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    let dog: any = await RedisCache.get(`dog:${id}`);

    if (!dog) {
      const { data: dogData, error } = await supabase.from('dogs').select('*').eq('id', id).single();
      if (error || !dogData) {
        throw new AppError('Dog not found', 404);
      }

      const { data: creator } = await supabase
        .from('users')
        .select('id, name, avatar_url, phone, role')
        .eq('id', dogData.created_by)
        .single();

      const { data: caretakerRows } = await supabase
        .from('dog_caretakers')
        .select('caretaker_type, is_primary, user_id')
        .eq('dog_id', id);

      let caretakers: any[] = [];
      if (caretakerRows?.length) {
        const { data: caretakerUsers } = await supabase
          .from('users')
          .select('id, name, avatar_url, phone, role')
          .in('id', caretakerRows.map((r: any) => r.user_id));
        caretakers = (caretakerRows || []).map((dc: any) => {
          const u = (caretakerUsers || []).find((u: any) => u.id === dc.user_id);
          return { ...u, caretaker_type: dc.caretaker_type, is_primary: dc.is_primary };
        });
      }

      dog = { ...dogData, creator, caretakers };
      await RedisCache.set(`dog:${id}`, dog, 3600);
    }

    res.json({ dog });
  }

  async updateDog(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const data = updateDogSchema.parse(req.body);

    const { data: dog, error } = await supabase
      .from('dogs')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error || !dog) {
      throw new AppError('Dog not found', 404);
    }

    await RedisCache.set(`dog:${id}`, dog, 3600);
    if (data.latitude && data.longitude) {
      await RedisCache.geoadd('dogs:locations', data.longitude, data.latitude, id);
    }
    await RedisCache.delPattern('dogs:nearby:*');

    res.json({
      message: 'Dog updated successfully',
      dog,
    });
  }

  async getNearbyDogs(req: AuthRequest, res: Response): Promise<void> {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radius = parseInt(req.query.radius as string) || 5;
    const gender = req.query.gender as string | undefined;
    const color = req.query.color as string | undefined;
    const is_sterilized = req.query.is_sterilized === 'true' ? true : undefined;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude required', 400);
    }

    const cacheKey = `dogs:nearby:${latitude}:${longitude}:${radius}:${gender}:${color}:${is_sterilized}`;
    let dogs = await RedisCache.get<any[]>(cacheKey);

    if (!dogs) {
      const box = getBoundingBox(latitude, longitude, radius);
      let query = supabase
        .from('dogs')
        .select('*')
        .gte('latitude', box.latMin)
        .lte('latitude', box.latMax)
        .gte('longitude', box.lngMin)
        .lte('longitude', box.lngMax)
        .order('last_seen_at', { ascending: false });

      if (gender) query = query.eq('gender', gender);
      if (color) query = query.ilike('color', `%${color}%`);
      if (is_sterilized !== undefined) query = query.eq('is_sterilized', is_sterilized);

      const { data: dogList, error } = await query;

      if (error) {
        throw new AppError(`Failed to fetch dogs: ${error.message}`, 500);
      }

      const rawDogs = dogList || [];
      if (rawDogs.length) {
        const creatorIds = [...new Set(rawDogs.map((d: any) => d.created_by))];
        const { data: creators } = await supabase.from('users').select('id, name, avatar_url').in('id', creatorIds);
        const creatorMap = (creators || []).reduce((acc: any, c) => { acc[c.id] = c; return acc; }, {});
        dogs = rawDogs.map((d: any) => ({ ...d, creator: creatorMap[d.created_by] }));
      } else {
        dogs = [];
      }
      await RedisCache.set(cacheKey, dogs, 300);
    }

    res.json({
      dogs: dogs ?? [],
      total: (dogs ?? []).length,
    });
  }

  async scanQRCode(req: AuthRequest, res: Response): Promise<void> {
    const { qr_data } = req.body;

    if (!qr_data) {
      throw new AppError('QR data required', 400);
    }

    const verification = await qrcodeService.verifyQRCode(qr_data);

    if (!verification.valid || !verification.dogId) {
      throw new AppError('Invalid QR code', 400);
    }

    const { data: dogData, error } = await supabase.from('dogs').select('*').eq('id', verification.dogId).single();
    if (error || !dogData) {
      throw new AppError('Dog not found', 404);
    }

    await supabase
      .from('dogs')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', verification.dogId);

    const { data: creator } = await supabase.from('users').select('id, name, avatar_url, phone').eq('id', dogData.created_by).single();
    const { data: caretakerRows } = await supabase.from('dog_caretakers').select('caretaker_type, is_primary, user_id').eq('dog_id', verification.dogId);
    let caretakers: any[] = [];
    if (caretakerRows?.length) {
      const { data: caretakerUsers } = await supabase.from('users').select('id, name, avatar_url, phone').in('id', caretakerRows.map((r: any) => r.user_id));
      caretakers = (caretakerRows || []).map((dc: any) => {
        const u = (caretakerUsers || []).find((u: any) => u.id === dc.user_id);
        return { ...u, caretaker_type: dc.caretaker_type, is_primary: dc.is_primary };
      });
    }

    const result = { ...dogData, creator, caretakers };
    await RedisCache.set(`dog:${dogData.id}`, result, 3600);

    res.json({
      message: 'QR code scanned successfully',
      dog: result,
    });
  }

  async addCaretaker(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id: dogId } = req.params;
    const { caretaker_type } = req.body;

    if (!caretaker_type) {
      throw new AppError('Caretaker type required', 400);
    }

    const { data: dog } = await supabase.from('dogs').select('id').eq('id', dogId).single();
    if (!dog) {
      throw new AppError('Dog not found', 404);
    }

    const { data: existing } = await supabase
      .from('dog_caretakers')
      .select('id')
      .eq('dog_id', dogId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('dog_caretakers')
        .update({ caretaker_type })
        .eq('dog_id', dogId)
        .eq('user_id', userId);
    } else {
      if (caretaker_type === CaretakerType.FEEDER || caretaker_type === CaretakerType.BOTH) {
        const { data: feederDogs } = await supabase
          .from('dog_caretakers')
          .select('id')
          .eq('user_id', userId)
          .or('caretaker_type.eq.feeder,caretaker_type.eq.both');
        if ((feederDogs?.length ?? 0) >= 10) {
          throw new AppError('Maximum 10 dogs allowed per feeder', 400);
        }
      }
      await supabase.from('dog_caretakers').insert({
        dog_id: dogId,
        user_id: userId,
        caretaker_type,
      });
    }

    await RedisCache.del(`dog:${dogId}`);
    res.json({ message: 'Caretaker added successfully' });
  }

  async getMyDogs(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const { data: records, error } = await supabase
      .from('dog_caretakers')
      .select('caretaker_type, is_primary, dog_id')
      .eq('user_id', userId);

    if (error) {
      throw new AppError(`Failed to fetch dogs: ${error.message}`, 500);
    }

    if (!records?.length) {
      res.json({ dogs: [] });
      return;
    }

    const dogIds = records.map((r: any) => r.dog_id);
    const { data: dogList } = await supabase
      .from('dogs')
      .select('*')
      .in('id', dogIds);

    const dogMap = (dogList || []).reduce((acc: any, d) => { acc[d.id] = d; return acc; }, {});
    const creatorIds = [...new Set((dogList || []).map((d: any) => d.created_by))];
    const { data: creators } = await supabase.from('users').select('id, name, avatar_url').in('id', creatorIds);
    const creatorMap = (creators || []).reduce((acc: any, c) => { acc[c.id] = c; return acc; }, {});

    const dogs = records
      .filter((r: any) => dogMap[r.dog_id])
      .map((record: any) => ({
        ...dogMap[record.dog_id],
        creator: creatorMap[dogMap[record.dog_id].created_by],
        my_caretaker_type: record.caretaker_type,
        is_primary: record.is_primary,
      }));

    res.json({ dogs });
  }

  async generateReport(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const { data: dog } = await supabase.from('dogs').select('id').eq('id', id).single();
    if (!dog) {
      throw new AppError('Dog not found', 404);
    }

    const pdfUrl = await pdfService.generateDogReport(id);

    res.json({
      message: 'Report generated successfully',
      pdf_url: pdfUrl,
    });
  }

  async deleteDog(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: dog } = await supabase.from('dogs').select('id, created_by').eq('id', id).single();
    if (!dog) {
      throw new AppError('Dog not found', 404);
    }

    if (dog.created_by !== userId) {
      throw new AppError('Unauthorized to delete this dog', 403);
    }

    await supabase.from('dogs').delete().eq('id', id);
    await RedisCache.del(`dog:${id}`);
    await RedisCache.delPattern('dogs:nearby:*');

    res.json({ message: 'Dog deleted successfully' });
  }
}

export default new DogController();
