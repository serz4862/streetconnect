import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { UserRole } from '../models/User';
import { config } from '../config';
import { RedisCache } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { supabase } from '../services/supabase.service';
import logger from '../utils/logger';

// Signup schema - uses phone OTP instead of Firebase
const signupSchema = z.object({
  phone: z.string().min(10),
  country_code: z.string(),
  name: z.string().min(2).max(100),
  role: z.nativeEnum(UserRole),
  country: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  location_name: z.string().optional(),
});

// Login schema - uses phone OTP instead of Firebase
const loginSchema = z.object({
  phone: z.string().min(10),
});

const sendOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  country_code: z.string().min(1),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(10).max(15),
  country_code: z.string().min(1),
  otp: z.string().min(4).max(6),
  name: z.string().min(2).max(100).optional(),
  pincode: z.string().optional(),
});

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_REDIS_PREFIX = 'otp:';

function normalizePhone(phone: string, countryCode: string): string {
  const phoneDigits = phone.replace(/\D/g, '');
  return phoneDigits.length === 10 && countryCode === '+91' ? `91${phoneDigits}` : phoneDigits;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class AuthController {
  /**
   * Send OTP to phone. In development: do NOT send SMS; log OTP in terminal and return in response.
   */
  async sendOtp(req: Request, res: Response): Promise<void> {
    const data = sendOtpSchema.parse(req.body);
    const lookupPhone = normalizePhone(data.phone, data.country_code);
    const otp = generateOtp();

    await RedisCache.set(`${OTP_REDIS_PREFIX}${lookupPhone}`, otp, OTP_TTL_SECONDS);

    const isDev = config.env === 'development';
    if (isDev) {
      logger.info(`[DEV] OTP for ${data.country_code}${data.phone} (key: ${lookupPhone}): ${otp}`);
      res.json({ message: 'OTP sent', otp });
      return;
    }

    // Production: send SMS via your provider (Twilio, MSG91, etc.). For now we only support dev flow.
    res.json({ message: 'OTP sent' });
  }

  async phoneLogin(req: Request, res: Response): Promise<void> {
    const data = phoneLoginSchema.parse(req.body);

    const lookupPhone = normalizePhone(data.phone, data.country_code);
    const storedOtp = await RedisCache.get<string>(`${OTP_REDIS_PREFIX}${lookupPhone}`);

    if (!storedOtp || storedOtp !== data.otp) {
      throw new AppError('Invalid OTP', 401);
    }

    await RedisCache.del(`${OTP_REDIS_PREFIX}${lookupPhone}`);

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', lookupPhone)
      .maybeSingle();

    let user = existingUser;
    let isNewUser = false;

    if (!user) {
      if (data.name) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            phone: lookupPhone,
            country_code: data.country_code,
            name: data.name,
            role: UserRole.ANIMAL_LOVER,
            pincode: data.pincode,
            is_verified: true,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          throw new AppError(`Failed to create user: ${createError.message}`, 500);
        }

        user = newUser;
        isNewUser = true;
      } else {
        throw new AppError('User not found', 404);
      }
    } else {
      // Update existing user to mark as active
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          is_active: true,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new AppError(`Failed to update user: ${updateError.message}`, 500);
      }

      user = updatedUser;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    await RedisCache.set(`user:${user.id}`, JSON.stringify(user), 3600);

    if (user.latitude && user.longitude) {
      await RedisCache.geoadd('users:locations', user.longitude, user.latitude, user.id);
    }

    const userPayload = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
      onboarding_completed: user.onboarding_completed,
    };

    res.json({
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      user: userPayload,
      token,
    });
  }

  async signup(req: Request, res: Response): Promise<void> {
    const data = signupSchema.parse(req.body);

    // Phone signup - no Firebase token needed (uses OTP verification instead)

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', data.phone)
      .maybeSingle();

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Create user
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        phone: data.phone,
        country_code: data.country_code,
        name: data.name,
        role: data.role,
        country: data.country,
        city: data.city,
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
        location_name: data.location_name,
        is_verified: true,
        is_active: true,
      })
      .select()
      .single();

    if (createError || !user) {
      throw new AppError(`Failed to create user: ${createError?.message}`, 500);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    // Cache user
    await RedisCache.set(`user:${user.id}`, JSON.stringify(user), 3600);

    // Update location in Redis for geospatial queries
    if (user.latitude && user.longitude) {
      await RedisCache.geoadd('users:locations', user.longitude, user.latitude, user.id);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      token,
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const data = loginSchema.parse(req.body);

    // Phone login - no Firebase token needed (uses OTP verification instead)
    // Find user by phone
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', data.phone)
      .single();

    if (findError || !user) {
      throw new AppError('User not found', 404);
    }

    if (!user.is_active) {
      throw new AppError('User account is inactive', 403);
    }

    // Update last active timestamp
    const updates: any = {
      last_active_at: new Date().toISOString(),
    };

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new AppError(`Failed to update user: ${updateError.message}`, 500);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: updatedUser.id,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    // Cache user
    await RedisCache.set(`user:${updatedUser.id}`, JSON.stringify(updatedUser), 3600);

    res.json({
      message: 'Login successful',
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
        role: updatedUser.role,
        avatar_url: updatedUser.avatar_url,
        onboarding_completed: updatedUser.onboarding_completed,
      },
      token,
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Blacklist token
      await RedisCache.set(`blacklist:${token}`, '1', 86400); // 24 hours
    }

    res.json({ message: 'Logout successful' });
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new AppError('Refresh token required', 400);
    }

    try {
      const decoded = jwt.verify(refresh_token, config.jwt.secret) as {
        userId: string;
        phone: string;
        role: string;
      };

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (error || !user || !user.is_active) {
        throw new AppError('User not found or inactive', 401);
      }

      const token = jwt.sign(
        {
          userId: user.id,
          phone: user.phone,
          role: user.role,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as SignOptions
      );

      res.json({ token });
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }
}

export default new AuthController();
