/**
 * Seed database with location-based data
 * Creates dogs and users near a specific location
 */
import { supabase } from '../services/supabase.service';
import logger from '../utils/logger';

// Helper to generate coordinate within radius (in degrees, ~1km = 0.009 degrees)
function generateNearbyCoordinate(lat: number, lng: number, radiusKm: number = 5) {
  const radiusDeg = (radiusKm / 111); // 1 degree ≈ 111km
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusDeg;
  
  return {
    latitude: lat + (distance * Math.cos(angle)),
    longitude: lng + (distance * Math.sin(angle)),
  };
}

const indianNames = {
  male: ['Raj', 'Arjun', 'Vikram', 'Amit', 'Rohit', 'Karan', 'Sanjay', 'Anil', 'Suresh', 'Ramesh'],
  female: ['Priya', 'Anjali', 'Pooja', 'Neha', 'Kavita', 'Sunita', 'Meera', 'Geeta', 'Lalita', 'Radha'],
};

const dogNames = ['Bruno', 'Max', 'Buddy', 'Rocky', 'Charlie', 'Cooper', 'Duke', 'Jack', 'Oliver', 'Tucker', 'Bailey', 'Toby', 'Leo', 'Oscar', 'Milo'];
const dogBreeds = ['Indian Pariah', 'Labrador', 'Golden Retriever', 'German Shepherd', 'Beagle', 'Pug', 'Mixed Breed'];
const dogColors = ['Brown', 'Black', 'White', 'Golden', 'Grey', 'Tan', 'Light Brown', 'Dark Brown'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return `91${Math.floor(7000000000 + Math.random() * 2999999999)}`;
}

async function seedLocationBased(centerLat: number, centerLng: number) {
  try {
    logger.info('🌱 Starting location-based seeding...');
    logger.info(`📍 Center location: ${centerLat}, ${centerLng}\n`);

    // Get test user ID
    const { data: testUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', '919999999999')
      .single();

    if (!testUser) {
      logger.error('❌ Test user not found! Please run regular seed first.');
      return;
    }

    logger.info('✅ Found test user:', testUser.id);

    // Create 20 users near location
    logger.info('\n👥 Creating 20 users near your location...');
    const users = [];
    
    for (let i = 0; i < 20; i++) {
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const name = randomElement(indianNames[gender]);
      const coords = generateNearbyCoordinate(centerLat, centerLng, 10); // Within 10km
      const role = i < 12 ? 'feeder' : 'rescuer';
      
      users.push({
        phone: randomPhone(),
        country_code: '+91',
        name: `${name} ${role === 'feeder' ? '(Feeder)' : '(Rescuer)'}`,
        role,
        latitude: coords.latitude,
        longitude: coords.longitude,
        location_name: `Near you`,
        is_verified: true,
        is_active: true,
        onboarding_completed: true,
      });
    }

    const { data: insertedUsers, error: usersError } = await supabase
      .from('users')
      .insert(users)
      .select('id, role');

    if (usersError) {
      logger.error('❌ Error creating users:', usersError.message);
      return;
    }

    logger.info(`✅ Created ${insertedUsers.length} users`);

    // Create 20 dogs near location (4 assigned to test user)
    logger.info('\n🐕 Creating 20 dogs near your location...');
    const dogs = [];
    const dogCoords = [];
    
    for (let i = 0; i < 20; i++) {
      const coords = generateNearbyCoordinate(centerLat, centerLng, 5); // Within 5km
      const creator = i < 4 ? testUser.id : randomElement(insertedUsers.filter(u => u.role === 'feeder')).id;
      
      dogs.push({
        name: randomElement(dogNames),
        breed: randomElement(dogBreeds),
        color: randomElement(dogColors),
        gender: randomElement(['male', 'female', 'unknown']),
        age_months: Math.floor(Math.random() * 60) + 6,
        health_status: randomElement(['healthy', 'needs_attention', 'injured']),
        is_vaccinated: Math.random() > 0.5,
        is_sterilized: Math.random() > 0.3,
        latitude: coords.latitude,
        longitude: coords.longitude,
        location_name: `Near you (${i + 1})`,
        last_seen_at: new Date().toISOString(),
        created_by: creator,
        photo_url: null, // Will be populated when users upload photos
      });
      
      dogCoords.push(coords);
    }

    const { data: insertedDogs, error: dogsError } = await supabase
      .from('dogs')
      .insert(dogs)
      .select('id');

    if (dogsError) {
      logger.error('❌ Error creating dogs:', dogsError.message);
      return;
    }

    logger.info(`✅ Created ${insertedDogs.length} dogs`);
    logger.info(`✅ First 4 dogs assigned to test user (9999999999)`);

    // Create caretaker relationships
    logger.info('\n👤 Creating caretaker relationships...');
    const caretakers = [];
    
    for (let i = 0; i < insertedDogs.length; i++) {
      const dog = insertedDogs[i];
      const feeders = insertedUsers.filter(u => u.role === 'feeder');
      
      // Each dog gets 1-2 caretakers
      const numCaretakers = Math.random() > 0.5 ? 2 : 1;
      for (let j = 0; j < numCaretakers; j++) {
        const caretaker = randomElement(feeders);
        caretakers.push({
          dog_id: dog.id,
          user_id: caretaker.id,
          type: randomElement(['primary', 'regular', 'occasional']),
        });
      }
    }

    const { error: caretakersError } = await supabase
      .from('dog_caretakers')
      .insert(caretakers);

    if (caretakersError) {
      logger.warn('⚠️  Some caretaker relationships may have failed:', caretakersError.message);
    } else {
      logger.info(`✅ Created ${caretakers.length} caretaker relationships`);
    }

    // Create feed logs
    logger.info('\n🍖 Creating feed logs...');
    const feedLogs = [];
    
    for (let i = 0; i < 15; i++) {
      const dog = randomElement(insertedDogs);
      const feeder = randomElement(insertedUsers.filter(u => u.role === 'feeder'));
      const daysAgo = Math.floor(Math.random() * 7);
      const fedAt = new Date();
      fedAt.setDate(fedAt.getDate() - daysAgo);
      
      feedLogs.push({
        dog_id: dog.id,
        fed_by: feeder.id,
        fed_at: fedAt.toISOString(),
        food_type: randomElement(['dry_food', 'wet_food', 'home_cooked']),
        quantity: randomElement(['small', 'medium', 'large']),
      });
    }

    const { error: feedError } = await supabase
      .from('feed_logs')
      .insert(feedLogs);

    if (feedError) {
      logger.warn('⚠️  Some feed logs may have failed:', feedError.message);
    } else {
      logger.info(`✅ Created ${feedLogs.length} feed logs`);
    }

    // Create reports
    logger.info('\n📝 Creating reports...');
    const reports = [];
    
    for (let i = 0; i < 10; i++) {
      const dog = randomElement(insertedDogs);
      const reporter = randomElement(insertedUsers);
      const coords = dogCoords[insertedDogs.indexOf(dog)];
      
      reports.push({
        dog_id: dog.id,
        reporter_id: reporter.id,
        type: randomElement(['issue', 'lost', 'found', 'injured', 'abuse', 'rescue']),
        title: randomElement(['Dog needs help', 'Lost dog sighting', 'Injured dog', 'Dog found']),
        description: 'Sample report created during seeding',
        status: randomElement(['pending', 'in_progress', 'resolved']),
        latitude: coords.latitude,
        longitude: coords.longitude,
        location_name: 'Near you',
      });
    }

    const { error: reportsError } = await supabase
      .from('reports')
      .insert(reports);

    if (reportsError) {
      logger.warn('⚠️  Some reports may have failed:', reportsError.message);
    } else {
      logger.info(`✅ Created ${reports.length} reports`);
    }

    logger.info('\n========================================');
    logger.info('✅ Location-based seeding complete!');
    logger.info('');
    logger.info('Summary:');
    logger.info(`  📍 Center: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`);
    logger.info(`  👥 Users: 20 (12 feeders, 8 rescuers)`);
    logger.info(`  🐕 Dogs: 20 (first 4 assigned to test user)`);
    logger.info(`  👤 Caretakers: ${caretakers.length} relationships`);
    logger.info(`  🍖 Feed logs: ${feedLogs.length}`);
    logger.info(`  📝 Reports: ${reports.length}`);
    logger.info('');
    logger.info('Test login: phone 9999999999, OTP 0000 or 000000');
    logger.info('Your test user now has 4 dogs in "My Dogs"!');
    logger.info('========================================\n');

  } catch (error: any) {
    logger.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

// Get location from command line arguments or use default (Mumbai)
const centerLat = parseFloat(process.argv[2] || '19.0760');
const centerLng = parseFloat(process.argv[3] || '72.8777');

seedLocationBased(centerLat, centerLng);
