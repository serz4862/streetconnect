import { supabase } from '../services/supabase.service';
import { storageService } from '../services/storage.service';
import logger from '../utils/logger';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// Sample data arrays
const dogNames = [
  'Bruno', 'Lucy', 'Max', 'Bella', 'Charlie', 'Daisy', 'Rocky', 'Luna',
  'Cooper', 'Sadie', 'Duke', 'Molly', 'Bear', 'Bailey', 'Jack', 'Sophie',
  'Toby', 'Chloe', 'Zeus', 'Penny', 'Oliver', 'Maggie', 'Tucker', 'Zoe',
  'Buddy', 'Lily', 'Oscar', 'Stella', 'Leo', 'Rosie'
];

const dogColors = [
  'Brown', 'Black', 'White', 'Golden', 'Grey', 'Spotted', 'Black and White',
  'Brown and White', 'Golden Brown', 'Dark Brown', 'Light Brown', 'Mixed'
];

const dogBreeds = [
  'Indian Pariah', 'Indie Dog', 'Mixed Breed', 'Street Dog', 'Unknown',
  'Labrador Mix', 'German Shepherd Mix', 'Indie Mix', 'Local Breed'
];

const indianNames = {
  male: [
    'Arjun', 'Rahul', 'Amit', 'Raj', 'Vikram', 'Karan', 'Rohan', 'Aditya',
    'Nikhil', 'Sanjay', 'Manish', 'Deepak', 'Suresh', 'Rakesh', 'Ashok',
    'Pradeep', 'Mahesh', 'Ramesh', 'Mukesh', 'Dinesh', 'Anil', 'Ravi',
    'Vijay', 'Ajay', 'Sandeep', 'Naveen', 'Praveen', 'Sachin', 'Vishal', 'Kapil'
  ],
  female: [
    'Priya', 'Anjali', 'Pooja', 'Neha', 'Rani', 'Kavita', 'Sunita', 'Ritu',
    'Sneha', 'Divya', 'Preeti', 'Swati', 'Nisha', 'Anita', 'Meena', 'Geeta',
    'Sita', 'Rita', 'Lalita', 'Savita'
  ]
};

const indianCities = [
  'South Delhi', 'Hauz Khas', 'Saket', 'Lajpat Nagar', 'Defence Colony', 
  'Greater Kailash', 'Nehru Place', 'Kalkaji', 'Green Park', 'Malviya Nagar',
  'Vasant Vihar', 'Safdarjung', 'INA', 'Jangpura', 'Kotla'
];

// Helper to generate random coordinates around a central point (South Delhi)
const CENTRAL_LAT = 28.5319; // New Delhi (South Delhi, 110017)
const CENTRAL_LNG = 77.2195;
const RADIUS_KM = 8;

function randomCoordinate() {
  const latOffset = (Math.random() - 0.5) * (RADIUS_KM / 111); // 1 degree lat ≈ 111km
  const lngOffset = (Math.random() - 0.5) * (RADIUS_KM / (111 * Math.cos(CENTRAL_LAT * Math.PI / 180)));
  
  return {
    latitude: parseFloat((CENTRAL_LAT + latOffset).toFixed(8)),
    longitude: parseFloat((CENTRAL_LNG + lngOffset).toFixed(8)),
  };
}

// Deterministic seed phones so re-run doesn't create duplicate users (unique 1–50)
function seedPhone(index: number) {
  return `9170000000${String(index).padStart(2, '0')}`; // 01..99
}

function randomPincode() {
  // South Delhi pincodes: 110017, 110019, 110024, etc.
  const delhiPincodes = ['110017', '110019', '110024', '110025', '110029', '110065'];
  return randomElement(delhiPincodes);
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateQRCode(dogId: string): Promise<{ qrCodeUrl: string; qrCodeId: string }> {
  const qrCodeId = uuidv4();
  const qrData = JSON.stringify({
    type: 'dog',
    id: dogId,
    qr_id: qrCodeId,
    timestamp: Date.now(),
  });

  const qrBuffer = await QRCode.toBuffer(qrData, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 500,
    margin: 2,
  });

  const qrCodeUrl = await storageService.uploadBuffer(qrBuffer, 'qr', 'image/png');

  return { qrCodeUrl, qrCodeId };
}

async function seedUsers() {
  logger.info('Seeding users...');

  const feeders = [];
  const rescuers = [];

  // Create 30 feeders (first one is test user - login with 9999999999 and OTP 0000 or 000000)
  for (let i = 0; i < 30; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const name = randomElement(indianNames[gender]);
    const coords = randomCoordinate();

    const feeder = {
      phone: i === 0 ? '919999999999' : seedPhone(i + 1), // 1-29
      country_code: '+91',
      name: i === 0 ? 'Test User' : `${name} (Feeder ${i + 1})`,
      role: 'feeder',
      city: randomElement(indianCities),
      pincode: randomPincode(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      is_verified: true,
      is_active: true,
      onboarding_completed: true,
    };

    feeders.push(feeder);
  }

  // Create 20 rescuers
  for (let i = 0; i < 20; i++) {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const name = randomElement(indianNames[gender]);
    const coords = randomCoordinate();

    const rescuer = {
      phone: seedPhone(31 + i), // 31-50 (avoid overlap with feeder 30)
      country_code: '+91',
      name: `${name} (Rescuer ${i + 1})`,
      role: 'rescuer',
      city: randomElement(indianCities),
      pincode: randomPincode(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      is_verified: true,
      is_active: true,
      onboarding_completed: true,
    };

    rescuers.push(rescuer);
  }

  // Upsert users so re-running seed doesn't fail (on conflict update so we get ids back)
  const allUsers = feeders.concat(rescuers);
  const { data, error } = await supabase
    .from('users')
    .upsert(allUsers, { onConflict: 'phone', ignoreDuplicates: false })
    .select('id, role');

  if (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }

  // If some were ignored (duplicates), fetch all by phone to get ids
  let userIds = data || [];
  if (userIds.length < allUsers.length) {
    const phones = allUsers.map((u: any) => u.phone);
    const { data: existing } = await supabase.from('users').select('id, role').in('phone', phones);
    userIds = existing || userIds;
  }

  logger.info(`✅ Users ready: ${userIds.length} (30 feeders + 20 rescuers)`);

  const feederIds = userIds.filter((u: any) => u.role === 'feeder').map((u: any) => u.id);
  const rescuerIds = userIds.filter((u: any) => u.role === 'rescuer').map((u: any) => u.id);

  return { feederIds, rescuerIds };
}

async function seedDogs(feederIds: string[], rescuerIds: string[]) {
  logger.info('Seeding dogs...');

  const dogs = [];
  const dogCaretakers = [];
  const feedLogs = [];

  for (let i = 0; i < 30; i++) {
    const coords = randomCoordinate();
    const createdBy = randomElement([...feederIds, ...rescuerIds]);
    
    // We'll generate QR codes after inserting to get dog IDs
    const dog = {
      name: randomElement(dogNames),
      color: randomElement(dogColors),
      gender: randomElement(['male', 'female', 'unknown']),
      breed: randomElement(dogBreeds),
      age_approx: randomInt(1, 10),
      is_sterilized: Math.random() > 0.5,
      health_status: randomElement(['healthy', 'sick', 'injured', 'unknown']),
      health_notes: Math.random() > 0.7 ? 'Checked by vet, doing well' : null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_name: `Near ${randomElement(indianCities)} Area`,
      created_by: createdBy,
      last_seen_at: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000).toISOString(),
      last_fed_at: new Date(Date.now() - randomInt(0, 2) * 24 * 60 * 60 * 1000).toISOString(),
      is_lost: false,
      is_found: false,
      description: `Friendly ${randomElement(dogColors).toLowerCase()} dog seen regularly in the area`,
    };

    dogs.push(dog);
  }

  // Insert dogs
  const { data: insertedDogs, error: dogError } = await supabase
    .from('dogs')
    .insert(dogs)
    .select('id, created_by');

  if (dogError) {
    logger.error('Error seeding dogs:', dogError);
    throw dogError;
  }

  logger.info(`✅ Created ${insertedDogs!.length} dogs`);

  // Generate QR codes and update dogs
  logger.info('Generating QR codes...');
  for (let i = 0; i < insertedDogs!.length; i++) {
    const dog = insertedDogs![i];
    const dogCoords = { latitude: dogs[i].latitude, longitude: dogs[i].longitude };

    try {
      const { qrCodeUrl, qrCodeId } = await generateQRCode(dog.id);
      
      await supabase
        .from('dogs')
        .update({
          qr_code_url: qrCodeUrl,
          qr_code_id: qrCodeId,
        })
        .eq('id', dog.id);
      
      logger.info(`Generated QR code for dog ${dog.id}`);
    } catch (error) {
      logger.error(`Failed to generate QR code for dog ${dog.id}:`, error);
    }

    // Assign 1-3 caretakers per dog
    const numCaretakers = randomInt(1, 3);
    const assignedCaretakers = new Set<string>();
    
    // Always include the creator
    assignedCaretakers.add(dog.created_by);

    // Add more random caretakers
    while (assignedCaretakers.size < numCaretakers) {
      const caretaker = randomElement([...feederIds, ...rescuerIds]);
      assignedCaretakers.add(caretaker);
    }

    // Create caretaker entries
    for (const userId of assignedCaretakers) {
      const isPrimary = userId === dog.created_by;
      dogCaretakers.push({
        dog_id: dog.id,
        user_id: userId,
        caretaker_type: feederIds.includes(userId) ? 'feeder' : 'rescuer',
        is_primary: isPrimary,
      });
    }

    // Create 2-5 feed logs for each dog
    const numFeeds = randomInt(2, 5);
    for (let j = 0; j < numFeeds; j++) {
      const feeder = randomElement([...assignedCaretakers]);
      feedLogs.push({
        dog_id: dog.id,
        user_id: feeder,
        fed_at: new Date(Date.now() - randomInt(0, 14) * 24 * 60 * 60 * 1000).toISOString(),
        notes: Math.random() > 0.7 ? 'Fed with biscuits and water' : null,
        latitude: dogCoords.latitude + (Math.random() - 0.5) * 0.001,
        longitude: dogCoords.longitude + (Math.random() - 0.5) * 0.001,
      });
    }
  }

  // Insert dog caretakers
  const { error: caretakerError } = await supabase
    .from('dog_caretakers')
    .insert(dogCaretakers);

  if (caretakerError) {
    logger.error('Error seeding dog caretakers:', caretakerError);
    throw caretakerError;
  }

  logger.info(`✅ Created ${dogCaretakers.length} dog caretaker assignments`);

  // Insert feed logs
  const { error: feedError } = await supabase
    .from('feed_logs')
    .insert(feedLogs);

  if (feedError) {
    logger.error('Error seeding feed logs:', feedError);
    throw feedError;
  }

  logger.info(`✅ Created ${feedLogs.length} feed logs`);

  return insertedDogs!.map(d => d.id);
}

async function seedReports(dogIds: string[], userIds: string[]) {
  logger.info('Seeding reports...');

  const reports = [];

  // Create 10-15 reports
  const numReports = randomInt(10, 15);
  
  for (let i = 0; i < numReports; i++) {
    const coords = randomCoordinate();
    const reportTypes = ['issue', 'health', 'abuse', 'lost', 'found'];
    const type = randomElement(reportTypes);
    
    const report = {
      dog_id: Math.random() > 0.3 ? randomElement(dogIds) : null,
      user_id: randomElement(userIds),
      type,
      status: randomElement(['pending', 'in_progress', 'resolved']),
      title: type === 'health' ? 'Dog needs medical attention' :
             type === 'abuse' ? 'Report of animal abuse' :
             type === 'lost' ? 'Lost dog sighting' :
             type === 'found' ? 'Found stray dog' :
             'Issue with street dog',
      description: `Detailed report about ${type} case. Needs immediate attention.`,
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_name: `Near ${randomElement(indianCities)} Junction`,
      resolved_by: Math.random() > 0.6 ? randomElement(userIds) : null,
      resolved_at: Math.random() > 0.6 ? new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000).toISOString() : null,
    };

    reports.push(report);
  }

  const { error } = await supabase
    .from('reports')
    .insert(reports);

  if (error) {
    logger.error('Error seeding reports:', error);
    throw error;
  }

  logger.info(`✅ Created ${reports.length} reports`);
}

async function main() {
  try {
    logger.info('🌱 Starting database seeding...');

    // Check Supabase connection
    const { error: connectionError } = await supabase.from('users').select('count').limit(1);
    if (connectionError) {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }

    // Seed users
    const { feederIds, rescuerIds } = await seedUsers();
    const allUserIds = [...feederIds, ...rescuerIds];

    // Seed dogs
    const dogIds = await seedDogs(feederIds, rescuerIds);

    // Seed reports
    await seedReports(dogIds, allUserIds);

    logger.info('✅ Database seeding completed successfully!');
    logger.info('\nSummary:');
    logger.info(`- Users: ${allUserIds.length} (30 feeders + 20 rescuers)`);
    logger.info(`- Dogs: ${dogIds.length} (with QR codes)`);
    logger.info(`- Dog Caretakers: Multiple per dog`);
    logger.info(`- Feed Logs: 2-5 per dog`);
    logger.info(`- Reports: 10-15 total`);
    logger.info('\nYou can now test the app with this seed data!');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
