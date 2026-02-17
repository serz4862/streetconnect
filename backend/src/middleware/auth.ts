import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { RedisCache } from '../config/redis';
import logger from '../utils/logger';
import { supabase } from '../services/supabase.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await RedisCache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token has been revoked' });
      return;
    }

    // Verify JWT
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      phone?: string;
      role: string;
    };

    // Resolve user by phone (source of truth) or fallback to userId for old tokens
    let dbUser;
    if (decoded.phone) {
      // New tokens: resolve by phone (source of truth)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', decoded.phone)
        .single();
      
      if (error) {
        logger.error('Error fetching user by phone:', error);
      }
      dbUser = data;
    } else {
      // Old tokens: resolve by userId (legacy)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();
      
      if (error) {
        logger.error('Error fetching user by id:', error);
      }
      dbUser = data;
    }

    if (!dbUser || !dbUser.is_active) {
      res.status(401).json({ error: 'User not found or inactive - please log in again' });
      return;
    }

    const userId = dbUser.id as string;
    let user: Record<string, unknown> | null = await RedisCache.get<Record<string, unknown>>(`user:${userId}`);
    if (!user) {
      user = dbUser as unknown as Record<string, unknown>;
      await RedisCache.set(`user:${userId}`, user, 3600);
    }

    req.user = {
      id: userId,
      phone: dbUser.phone as string,
      role: (dbUser.role as string) ?? decoded.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      phone: string;
      role: string;
    };

    req.user = {
      id: decoded.userId,
      phone: decoded.phone,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};
