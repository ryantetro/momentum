/**
 * Script to create Supabase Storage buckets
 * Run this with: node scripts/create-storage-buckets.js
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

async function createBuckets() {
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

  const buckets = [
    {
      id: 'logos',
      name: 'logos',
      public: true,
      fileSizeLimit: 20971520, // 20MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    },
    {
      id: 'booking-files',
      name: 'booking-files',
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: null, // Allow all types
    },
  ]

  console.log('📦 Creating Supabase Storage buckets...\n')

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.error(`❌ Error listing buckets:`, listError.message)
        continue
      }

      const exists = existingBuckets?.some((b) => b.id === bucket.id)

      if (exists) {
        console.log(`✅ Bucket "${bucket.id}" already exists, skipping...`)
        continue
      }

      // Create bucket
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      })

      if (error) {
        console.error(`❌ Error creating bucket "${bucket.id}":`, error.message)
      } else {
        console.log(`✅ Created bucket "${bucket.id}" (public: ${bucket.public})`)
      }
    } catch (error) {
      console.error(`❌ Unexpected error creating bucket "${bucket.id}":`, error.message)
    }
  }

  console.log('\n✨ Done!')
}

createBuckets().catch(console.error)



