import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { UserRole } from '../models/User';
import { config } from '../config';
import { RedisCache } from '../config/redis';
import firebaseService from '../services/firebase.service';
import { AppError } from '../middleware/errorHandler';
import { supabase } from '../services/supabase.service';

const signupSchema = z.object({
  firebase_token: z.string(),
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

const loginSchema = z.object({
  firebase_token: z.string(),
  phone: z.string().min(10),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(10).max(15),
  country_code: z.string().min(1),
  otp: z.string().min(4).max(6),
  name: z.string().min(2).max(100).optional(),
  pincode: z.string().optional(),
});

const VALID_DEV_OTPS = ['0000', '000000']; // Dev OTPs for testing - both 4 and 6 zeros work

export class AuthController {
  async phoneLogin(req: Request, res: Response): Promise<void> {
    const data = phoneLoginSchema.parse(req.body);

    if (!VALID_DEV_OTPS.includes(data.otp)) {
      throw new AppError('Invalid OTP', 401);
    }

    // Normalize phone: DB stores "919735892566" for +91 9735892566
    const phoneDigits = data.phone.replace(/\D/g, '');
    const lookupPhone = phoneDigits.length === 10 && data.country_code === '+91' ? `91${phoneDigits}` : phoneDigits;

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

    // Verify Firebase token
    const decodedToken = await firebaseService.verifyIdToken(data.firebase_token);

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
        firebase_uid: decodedToken.uid,
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

    // Verify Firebase token
    const decodedToken = await firebaseService.verifyIdToken(data.firebase_token);

    // Find user
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

    // Update Firebase UID if changed and last active
    const updates: any = {
      last_active_at: new Date().toISOString(),
    };

    if (user.firebase_uid !== decodedToken.uid) {
      updates.firebase_uid = decodedToken.uid;
    }

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
