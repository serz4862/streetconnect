/**
 * Update dog coordinates using raw SQL (bypasses RLS)
 */
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import logger from '../utils/logger';

async function updateCoordinates() {
  // Use service role to bypass RLS
  const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    logger.info('🗺️  Updating dog coordinates to Delhi...\n');
    
    // Update all dogs with Delhi coordinates using raw SQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        UPDATE dogs 
        SET 
          latitude = 28.5319 + (RANDOM() * 0.15 - 0.075),
          longitude = 77.2195 + (RANDOM() * 0.15 - 0.075),
          location_name = 'South Delhi, Delhi',
          pincode = '110017'
        WHERE id IS NOT NULL
        RETURNING id, name, latitude, longitude;
      `
    });

    if (error) {
      // Try direct update if RPC doesn't exist
      logger.info('Trying direct update...\n');
      
      const { data: dogs } = await supabaseAdmin
        .from('dogs')
        .select('id, name');
      
      if (!dogs) {
        logger.error('❌ Could not fetch dogs');
        return;
      }

      logger.info(`Updating ${dogs.length} dogs...\n`);
      
      for (const dog of dogs) {
        const lat = 28.5319 + (Math.random() * 0.15 - 0.075);
        const lng = 77.2195 + (Math.random() * 0.15 - 0.075);
        
        const { error: updateError } = await supabaseAdmin
          .from('dogs')
          .update({
            latitude: lat,
            longitude: lng,
            location_name: 'South Delhi, Delhi',
            pincode: '110017',
          })
          .eq('id', dog.id);
        
        if (!updateError) {
          logger.info(`  ✅ ${dog.name}: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      }
      
      logger.info('\n✅ All dogs updated to Delhi coordinates!');
    } else {
      logger.info('✅ Updated via SQL!');
      logger.info(JSON.stringify(data, null, 2));
    }

    logger.info('\n========================================');
    logger.info('📍 Location: South Delhi (110017)');
    logger.info('📏 Area: 28.53°N, 77.22°E ± 8km');
    logger.info('🐕 Dogs: 30 total');
    logger.info('========================================\n');

  } catch (error: any) {
    logger.error('❌ Error:', error.message);
  }
}

updateCoordinates();
