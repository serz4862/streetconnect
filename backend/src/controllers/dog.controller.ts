import { Response } from 'express';
import { z } from 'zod';
import { Op } from 'sequelize';
import Dog, { DogGender, DogHealthStatus } from '../models/Dog';
import DogCaretaker, { CaretakerType } from '../models/DogCaretaker';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import qrcodeService from '../services/qrcode.service';
import pdfService from '../services/pdf.service';

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

export class DogController {
  async createDog(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data = createDogSchema.parse(req.body);

    // Create dog
    const dog = await Dog.create({
      ...data,
      created_by: userId,
      last_seen_at: new Date(),
    });

    // Generate QR code
    const { qrCodeUrl, qrCodeId } = await qrcodeService.generateDogQRCode(dog.id);
    dog.qr_code_url = qrCodeUrl;
    dog.qr_code_id = qrCodeId;
    await dog.save();

    // Add creator as caretaker if specified
    if (data.caretaker_type) {
      await DogCaretaker.create({
        dog_id: dog.id,
        user_id: userId,
        caretaker_type: data.caretaker_type,
        is_primary: true,
      });
    }

    // Add to geolocation cache
    await RedisCache.geoadd('dogs:locations', data.longitude, data.latitude, dog.id);

    // Cache dog
    await RedisCache.set(`dog:${dog.id}`, dog.toJSON(), 3600);

    // Invalidate nearby dogs cache
    await RedisCache.delPattern('dogs:nearby:*');

    res.status(201).json({
      message: 'Dog created successfully',
      dog: dog.toJSON(),
    });
  }

  async getDogById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    // Try cache first
    let dog: any = await RedisCache.get(`dog:${id}`);

    if (!dog) {
      const dbDog = await Dog.findByPk(id, {
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url', 'phone', 'role'] },
          {
            model: User,
            as: 'caretakers',
            attributes: ['id', 'name', 'avatar_url', 'phone', 'role'],
            through: { attributes: ['caretaker_type', 'is_primary'] },
          },
        ],
      });

      if (!dbDog) {
        throw new AppError('Dog not found', 404);
      }

      dog = dbDog.toJSON();
      await RedisCache.set(`dog:${id}`, dog, 3600);
    }

    res.json({ dog });
  }

  async updateDog(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const data = updateDogSchema.parse(req.body);

    const dog = await Dog.findByPk(id);
    if (!dog) {
      throw new AppError('Dog not found', 404);
    }

    // Update fields
    Object.assign(dog, data);
    await dog.save();

    // Update cache
    await RedisCache.set(`dog:${id}`, dog.toJSON(), 3600);

    // Update geolocation if changed
    if (data.latitude && data.longitude) {
      await RedisCache.geoadd('dogs:locations', data.longitude, data.latitude, id);
    }

    // Invalidate nearby dogs cache
    await RedisCache.delPattern('dogs:nearby:*');

    res.json({
      message: 'Dog updated successfully',
      dog: dog.toJSON(),
    });
  }

  async getNearbyDogs(req: AuthRequest, res: Response): Promise<void> {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radius = parseInt(req.query.radius as string) || 5; // Default 5km
    const gender = req.query.gender as DogGender | undefined;
    const color = req.query.color as string | undefined;
    const is_sterilized = req.query.is_sterilized === 'true' ? true : undefined;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude required', 400);
    }

    // Create cache key
    const cacheKey = `dogs:nearby:${latitude}:${longitude}:${radius}:${gender}:${color}:${is_sterilized}`;

    // Try cache first
    let dogs = await RedisCache.get<Dog[]>(cacheKey);

    if (!dogs) {
      // Get nearby dog IDs from Redis
      const nearbyDogIds = await RedisCache.georadius(
        'dogs:locations',
        longitude,
        latitude,
        radius,
        'km'
      );

      if (nearbyDogIds.length === 0) {
        res.json({ dogs: [], total: 0 });
        return;
      }

      // Build query filters
      const where: any = {
        id: nearbyDogIds,
      };

      if (gender) where.gender = gender;
      if (color) where.color = { [Op.iLike]: `%${color}%` };
      if (is_sterilized !== undefined) where.is_sterilized = is_sterilized;

      // Fetch dogs
      const dbDogs = await Dog.findAll({
        where,
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] },
        ],
        order: [['last_seen_at', 'DESC']],
      });

      dogs = (dbDogs || []).map((d) => d.toJSON());

      // Cache for 5 minutes
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

    const dog = await Dog.findByPk(verification.dogId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url', 'phone'] },
        {
          model: User,
          as: 'caretakers',
          attributes: ['id', 'name', 'avatar_url', 'phone'],
          through: { attributes: ['caretaker_type', 'is_primary'] },
        },
      ],
    });

    if (!dog) {
      throw new AppError('Dog not found', 404);
    }

    // Update last seen
    dog.last_seen_at = new Date();
    await dog.save();

    // Update cache
    await RedisCache.set(`dog:${dog.id}`, dog.toJSON(), 3600);

    res.json({
      message: 'QR code scanned successfully',
      dog: dog.toJSON(),
    });
  }

  async addCaretaker(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id: dogId } = req.params;
    const { caretaker_type } = req.body;

    if (!caretaker_type) {
      throw new AppError('Caretaker type required', 400);
    }

    const dog = await Dog.findByPk(dogId);
    if (!dog) {
      throw new AppError('Dog not found', 404);
    }

    // Check if user is already a caretaker
    const existing = await DogCaretaker.findOne({
      where: { dog_id: dogId, user_id: userId },
    });

    if (existing) {
      existing.caretaker_type = caretaker_type;
      await existing.save();
    } else {
      // Check limit for feeders (max 10 dogs)
      if (caretaker_type === CaretakerType.FEEDER || caretaker_type === CaretakerType.BOTH) {
        const count = await DogCaretaker.count({
          where: {
            user_id: userId,
            caretaker_type: [CaretakerType.FEEDER, CaretakerType.BOTH],
          },
        });

        if (count >= 10) {
          throw new AppError('Maximum 10 dogs allowed per feeder', 400);
        }
      }

      await DogCaretaker.create({
        dog_id: dogId,
        user_id: userId,
        caretaker_type,
      });
    }

    // Invalidate cache
    await RedisCache.del(`dog:${dogId}`);

    res.json({ message: 'Caretaker added successfully' });
  }

  async getMyDogs(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;

    const caretakerRecords = await DogCaretaker.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Dog,
          as: 'dog',
          include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'avatar_url'] }],
        },
      ],
    });

    const dogs = caretakerRecords.map((record: any) => ({
      ...record.dog.toJSON(),
      my_caretaker_type: record.caretaker_type,
      is_primary: record.is_primary,
    }));

    res.json({ dogs });
  }

  async generateReport(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const dog = await Dog.findByPk(id);
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

    const dog = await Dog.findByPk(id);
    if (!dog) {
      throw new AppError('Dog not found', 404);
    }

    if (dog.created_by !== userId) {
      throw new AppError('Unauthorized to delete this dog', 403);
    }

    await dog.destroy();

    // Invalidate cache
    await RedisCache.del(`dog:${id}`);
    await RedisCache.delPattern('dogs:nearby:*');

    res.json({ message: 'Dog deleted successfully' });
  }
}

export default new DogController();
