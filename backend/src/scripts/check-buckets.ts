/**
 * Check Supabase storage buckets
 */
import { supabase } from '../services/supabase.service';
import logger from '../utils/logger';

async function checkBuckets() {
  try {
    logger.info('📦 Checking storage buckets...\n');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      logger.error('❌ Error listing buckets:', error.message);
      return;
    }
    
    const requiredBuckets = ['dogs', 'reports', 'feed', 'chat', 'qr', 'avatars'];
    
    logger.info(`Found ${buckets?.length || 0} buckets:\n`);
    
    buckets?.forEach(bucket => {
      logger.info(`  ✅ ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    const missing = requiredBuckets.filter(
      name => !buckets?.some(b => b.name === name)
    );
    
    if (missing.length > 0) {
      logger.warn(`\n⚠️  Missing buckets: ${missing.join(', ')}`);
      logger.info('\nCreate them by running: npm run setup');
    } else {
      logger.info('\n✅ All required buckets exist!');
    }
    
    // Test upload to dogs bucket
    logger.info('\n🧪 Testing upload to "dogs" bucket...');
    
    const testContent = Buffer.from('test image content');
    const testPath = `test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('dogs')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: true,
      });
    
    if (uploadError) {
      logger.error('❌ Upload test failed:', uploadError.message);
    } else {
      logger.info('✅ Upload test successful!');
      
      // Get public URL
      const { data } = supabase.storage
        .from('dogs')
        .getPublicUrl(testPath);
      
      logger.info(`   URL: ${data.publicUrl}`);
      
      // Clean up
      await supabase.storage.from('dogs').remove([testPath]);
      logger.info('   Test file cleaned up.');
    }
    
    logger.info('\n========================================');
    logger.info('✅ Storage check complete!');
    logger.info('========================================\n');
    
  } catch (error: any) {
    logger.error('❌ Error:', error.message);
  }
}

checkBuckets();
