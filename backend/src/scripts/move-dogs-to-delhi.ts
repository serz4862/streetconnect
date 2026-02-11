/**
 * Move all dogs to Delhi coordinates
 */
import { supabase } from '../services/supabase.service';
import logger from '../utils/logger';

// Delhi South coordinates (pincode 110017 area)
const DELHI_CENTER = {
  lat: 28.5319,
  lng: 77.2195,
};

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Generate coordinate within 10km of Delhi center
function generateDelhiCoordinate() {
  const radiusKm = randomInRange(0.5, 8); // 0.5-8km from center
  const angle = Math.random() * 2 * Math.PI;
  const radiusDeg = radiusKm / 111; // 1 degree ≈ 111km
  
  return {
    latitude: DELHI_CENTER.lat + (radiusDeg * Math.cos(angle)),
    longitude: DELHI_CENTER.lng + (radiusDeg * Math.sin(angle)),
  };
}

async function moveDogs() {
  try {
    logger.info('🗺️  Moving all dogs to Delhi coordinates...\n');
    
    // Get all dogs
    const { data: dogs, error } = await supabase
      .from('dogs')
      .select('id, name');
    
    if (error || !dogs) {
      logger.error('❌ Error fetching dogs:', error?.message);
      return;
    }
    
    logger.info(`Found ${dogs.length} dogs to update\n`);
    
    // Update each dog with Delhi coordinates
    for (let i = 0; i < dogs.length; i++) {
      const dog = dogs[i];
      const coords = generateDelhiCoordinate();
      
      const { error: updateError } = await supabase
        .from('dogs')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude,
          location_name: `South Delhi, Delhi`,
          pincode: '110017',
        })
        .eq('id', dog.id);
      
      if (updateError) {
        logger.error(`  ❌ Error updating ${dog.name}:`, updateError.message);
      } else {
        logger.info(`  ✅ ${dog.name}: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      }
    }
    
    logger.info('\n========================================');
    logger.info('✅ All dogs moved to Delhi!');
    logger.info(`📍 Center: ${DELHI_CENTER.lat}, ${DELHI_CENTER.lng}`);
    logger.info('📮 Pincode: 110017 (South Delhi)');
    logger.info('📏 Radius: 0.5-8km from center');
    logger.info('========================================\n');
    
  } catch (error: any) {
    logger.error('❌ Error:', error.message);
  }
}

moveDogs();
