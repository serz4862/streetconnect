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
import { isDogImage } from '../services/vision.service';
import { logDogActivity, describeChanges } from '../services/activity.service';

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

const updateDogSchema = createDogSchema.partial().extend({
  is_lost: z.boolean().optional(),
  is_found: z.boolean().optional(),
  last_seen_at: z.string().optional(),
});

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

/**
 * Normalise a dog DB row so the mobile app always sees consistent fields:
 *  - image_url (some seed rows used photo_url)
 *  - age_approx in years (some seeds stored age_months)
 *  - numeric lat/lng (DB may return strings)
 *  - health_status mapped to the allowed frontend enum values
 *  - is_sterilized always boolean
 */
function normalizeDog(d: Record<string, unknown>): Record<string, unknown> {
  if (!d || typeof d !== 'object') return d ?? {};

  const image_url =
    (d.image_url as string | undefined) || (d.photo_url as string | undefined) || undefined;

  let age_approx: number | undefined;
  if (d.age_approx != null && d.age_approx !== '') {
    const n = Number(d.age_approx);
    if (!Number.isNaN(n)) age_approx = n;
  } else if (d.age_months != null && d.age_months !== '') {
    const months = Number(d.age_months);
    if (!Number.isNaN(months)) age_approx = Math.max(0, Math.min(30, Math.round(months / 12)));
  }

  const latitude = d.latitude != null ? Number(d.latitude) : d.latitude;
  const longitude = d.longitude != null ? Number(d.longitude) : d.longitude;

  const rawHealth = String(d.health_status ?? 'unknown');
  const healthMap: Record<string, string> = { needs_attention: 'sick' };
  const allowed = new Set(['healthy', 'sick', 'injured', 'critical', 'unknown']);
  const health_status = allowed.has(rawHealth)
    ? rawHealth
    : allowed.has(healthMap[rawHealth] ?? '')
      ? healthMap[rawHealth]
      : 'unknown';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { photo_url: _p, age_months: _m, ...rest } = d;
  return {
    ...rest,
    image_url,
    age_approx,
    latitude,
    longitude,
    health_status,
    is_sterilized: Boolean(d.is_sterilized),
  };
}

function normalizeDogs(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return (rows || []).map(normalizeDog);
}

export class DogController {
  /** Quick check: is this image URL a dog? Used by frontend right after upload. */
  async validateImage(req: AuthRequest, res: Response): Promise<void> {
    const { image_url } = z.object({ image_url: z.string().url() }).parse(req.body);
    const ok = await isDogImage(image_url);
    if (!ok) {
      throw new AppError('This is not a dog. Please upload a photo of a dog.', 400);
    }
    res.json({ valid: true, message: 'Image is a dog' });
  }

  async createDog(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = createDogSchema.parse(req.body);

    if (data.image_url) {
      const ok = await isDogImage(data.image_url);
      if (!ok) {
        throw new AppError('This is not a dog. Please upload a photo of a dog.', 400);
      }
    }

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

    if (data.caretaker_type) {
      await supabase.from('dog_caretakers').insert({
        dog_id: dog.id,
        user_id: userId,
        caretaker_type: data.caretaker_type,
        is_primary: true,
      });
    }

    await RedisCache.geoadd('dogs:locations', data.longitude, data.latitude, dog.id);

    await logDogActivity(
      dog.id,
      userId,
      'created',
      `${data.name || 'Dog'} added to StreetConnect`,
      data.description,
      { health_status: data.health_status ?? 'unknown', location: data.location_name },
    );

    const finalDog = normalizeDog({ ...dog, qr_code_url: qrCodeUrl, qr_code_id: qrCodeId });
    await RedisCache.set(`dog:${dog.id}`, finalDog, 3600);
    await RedisCache.delPattern('dogs:nearby:*');

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

      dog = normalizeDog({ ...dogData, creator, caretakers });
      await RedisCache.set(`dog:${id}`, dog, 3600);
    } else {
      dog = normalizeDog(dog as Record<string, unknown>);
    }

    res.json({ dog });
  }

  async updateDog(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = updateDogSchema.parse(req.body);

    // Skip dog-image validation for is_lost / is_found toggles
    if (data.image_url) {
      const ok = await isDogImage(data.image_url);
      if (!ok) {
        throw new AppError('This is not a dog. Please upload a photo of a dog.', 400);
      }
    }

    const { data: before } = await supabase.from('dogs').select('*').eq('id', id).single();

    const { data: dog, error } = await supabase
      .from('dogs')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error || !dog) {
      throw new AppError('Dog not found', 404);
    }

    if (before) {
      if ('is_lost' in data) {
        if (data.is_lost && !before.is_lost) {
          await logDogActivity(id, userId, 'lost', `${before.name || 'Dog'} reported lost`, undefined, { previous_status: before.health_status });
        } else if (!data.is_lost && before.is_lost) {
          await logDogActivity(id, userId, 'found', `${before.name || 'Dog'} marked as found safe`);
        }
      } else if (data.health_status && data.health_status !== before.health_status) {
        await logDogActivity(id, userId, 'status_changed',
          `Health status changed: ${before.health_status} → ${data.health_status}`,
          undefined,
          { old_status: before.health_status, new_status: data.health_status },
        );
      } else if (data.image_url && data.image_url !== before.image_url) {
        await logDogActivity(id, userId, 'image_updated', `${before.name || 'Dog'} photo updated`);
      } else {
        const desc = describeChanges(before as any, data as any);
        if (desc !== 'Info updated' || Object.keys(data).length > 0) {
          await logDogActivity(id, userId, 'info_updated', `Info updated`, desc !== 'Info updated' ? desc : undefined);
        }
      }
    }

    const normalized = normalizeDog(dog as Record<string, unknown>);
    await RedisCache.set(`dog:${id}`, normalized, 3600);
    if (data.latitude && data.longitude) {
      await RedisCache.geoadd('dogs:locations', data.longitude, data.latitude, id);
    }
    await RedisCache.delPattern('dogs:nearby:*');

    res.json({
      message: 'Dog updated successfully',
      dog: normalized,
    });
  }

  async getNearbyDogs(req: AuthRequest, res: Response): Promise<void> {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radius = parseInt(req.query.radius as string) || 5;
    const gender = req.query.gender as string | undefined;
    const color = req.query.color as string | undefined;
    const is_sterilized = req.query.is_sterilized === 'true' ? true : undefined;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
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
        dogs = normalizeDogs(rawDogs.map((d: any) => ({ ...d, creator: creatorMap[d.created_by] })));
      } else {
        dogs = [];
      }
      await RedisCache.set(cacheKey, dogs, 300);
    } else {
      dogs = normalizeDogs(dogs);
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

    const result = normalizeDog({ ...dogData, creator, caretakers });
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

    const dogs = normalizeDogs(
      records
        .filter((r: any) => dogMap[r.dog_id])
        .map((record: any) => ({
          ...dogMap[record.dog_id],
          creator: creatorMap[dogMap[record.dog_id].created_by],
          my_caretaker_type: record.caretaker_type,
          is_primary: record.is_primary,
        }))
    );

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

  /** Return all activity log entries for a dog, most recent first */
  async getDogActivity(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const { data, error } = await supabase
      .from('dog_activity_log')
      .select('*')
      .eq('dog_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new AppError(`Failed to fetch activity: ${error.message}`, 500);
    }

    const entries = data || [];
    const userIds = [...new Set(entries.map((e: any) => e.user_id).filter(Boolean))];
    const { data: users } = userIds.length
      ? await supabase.from('users').select('id, name, avatar_url').in('id', userIds)
      : { data: [] };
    const userMap = (users || []).reduce((acc: any, u: any) => { acc[u.id] = u; return acc; }, {});

    res.json({
      activity: entries.map((e: any) => ({
        ...e,
        actor: e.user_id ? userMap[e.user_id] : null,
      })),
    });
  }
}

export default new DogController();
