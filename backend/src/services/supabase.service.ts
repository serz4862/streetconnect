import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dns from 'dns';
import { config } from '../config';
import logger from '../utils/logger';

// ISP DNS hijacking fix: use Google + Cloudflare DNS so Supabase URLs resolve correctly.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

class SupabaseService {
  private client: SupabaseClient;
  
  constructor() {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      logger.warn('Supabase credentials not configured. Service will not be available.');
      this.client = null as any;
      return;
    }

    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    logger.info('✅ Supabase client initialized');
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    return this.client;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client.from('users').select('count').limit(1);
      if (error) {
        logger.error('Supabase connection test failed:', error);
        return false;
      }
      logger.info('✅ Supabase connection successful');
      return true;
    } catch (error) {
      logger.error('Supabase connection test error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
export const supabase = supabaseService.getClient();
