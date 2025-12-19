/**
 * Script to create Supabase Storage RLS policies
 * Run this with: node scripts/setup-storage-policies.js
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

async function setupStoragePolicies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
    console.error('\nPlease set these in your .env.local file')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔒 Setting up Supabase Storage RLS policies...\n')

  // Policies for logos bucket
  const logosPolicies = [
    {
      name: 'Photographers can upload their own logos',
      bucket: 'logos',
      operation: 'INSERT',
      definition: `(bucket_id = 'logos' AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM photographers WHERE user_id = auth.uid()
      ))`,
    },
    {
      name: 'Photographers can view their own logos',
      bucket: 'logos',
      operation: 'SELECT',
      definition: `(bucket_id = 'logos' AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM photographers WHERE user_id = auth.uid()
      ))`,
    },
    {
      name: 'Photographers can update their own logos',
      bucket: 'logos',
      operation: 'UPDATE',
      definition: `(bucket_id = 'logos' AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM photographers WHERE user_id = auth.uid()
      ))`,
    },
    {
      name: 'Photographers can delete their own logos',
      bucket: 'logos',
      operation: 'DELETE',
      definition: `(bucket_id = 'logos' AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM photographers WHERE user_id = auth.uid()
      ))`,
    },
    {
      name: 'Public can view logos',
      bucket: 'logos',
      operation: 'SELECT',
      definition: `bucket_id = 'logos'`,
    },
  ]

  // Policies for booking-files bucket
  const bookingFilesPolicies = [
    {
      name: 'Photographers can upload files for their bookings',
      bucket: 'booking-files',
      operation: 'INSERT',
      definition: `(bucket_id = 'booking-files' AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM bookings 
        WHERE photographer_id IN (
          SELECT id FROM photographers WHERE user_id = auth.uid()
        )
      ))`,
    },
    {
      name: 'Photographers can view files for their bookings',
      bucket: 'booking-files',
      operation: 'SELECT',
      definition: `(bucket_id = 'booking-files' AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM bookings 
        WHERE photographer_id IN (
          SELECT id FROM photographers WHERE user_id = auth.uid()
        )
      ))`,
    },
    {
      name: 'Photographers can delete files for their bookings',
      bucket: 'booking-files',
      operation: 'DELETE',
      definition: `(bucket_id = 'booking-files' AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM bookings 
        WHERE photographer_id IN (
          SELECT id FROM photographers WHERE user_id = auth.uid()
        )
      ))`,
    },
  ]

  const allPolicies = [...logosPolicies, ...bookingFilesPolicies]

  for (const policy of allPolicies) {
    try {
      // Check if policy already exists
      const { data: existingPolicies, error: listError } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(1)

      // Note: We can't easily check if a policy exists via the JS client
      // So we'll try to create it and handle the error if it already exists

      // Create policy using SQL (via RPC or direct SQL)
      // Since the JS client doesn't have a direct way to create storage policies,
      // we'll need to use the REST API or provide SQL instructions
      
      console.log(`📝 Policy: ${policy.name}`)
      console.log(`   Bucket: ${policy.bucket}`)
      console.log(`   Operation: ${policy.operation}`)
      console.log(`   Definition: ${policy.definition.substring(0, 80)}...`)
    } catch (error) {
      console.error(`❌ Error processing policy "${policy.name}":`, error.message)
    }
  }

  console.log('\n⚠️  Note: Storage policies must be created via SQL in Supabase.')
  console.log('   Please run the SQL from: supabase/migrations/016_storage_policies.sql\n')
}

setupStoragePolicies().catch(console.error)

