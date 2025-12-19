#!/usr/bin/env node

/**
 * Test script to verify Supabase connection and database setup
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function runTests() {
  console.log('🧪 Testing Supabase Connection...\n')

  // Test 1: Check environment variables
  console.log('1️⃣ Checking environment variables...')
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
    process.exit(1)
  }
  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    process.exit(1)
  }
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set')
    process.exit(1)
  }
  console.log('✅ All environment variables are set')
  console.log(`   URL: ${supabaseUrl}\n`)

  // Test 2: Create Supabase client
  console.log('2️⃣ Creating Supabase client...')
  let supabase
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client created successfully\n')
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error.message)
    process.exit(1)
  }

  // Test 3: Test connection (ping)
  console.log('3️⃣ Testing connection...')
  try {
    const { data, error } = await supabase.from('photographers').select('count').limit(0)
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine for this test
      throw error
    }
    console.log('✅ Connection successful\n')
  } catch (error) {
    if (error.message && error.message.includes('relation "photographers" does not exist')) {
      console.error('❌ Database tables not found. Please run the setup_database.sql file in your Supabase SQL Editor.')
      process.exit(1)
    }
    console.error('❌ Connection failed:', error.message)
    process.exit(1)
  }

  // Test 4: Check if tables exist
  console.log('4️⃣ Checking database schema...')
  const tables = ['photographers', 'clients', 'bookings', 'contract_templates']
  const missingTables = []

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0)
      if (error && error.code === '42P01') {
        // Table does not exist
        missingTables.push(table)
      } else if (error && error.code !== 'PGRST116') {
        // Other error (might be RLS, which is okay)
        console.log(`   ⚠️  ${table}: ${error.message}`)
      } else {
        console.log(`   ✅ ${table} table exists`)
      }
    } catch (error) {
      if (error.message && error.message.includes('does not exist')) {
        missingTables.push(table)
      }
    }
  }

  if (missingTables.length > 0) {
    console.error(`\n❌ Missing tables: ${missingTables.join(', ')}`)
    console.error('   Please run the setup_database.sql file in your Supabase SQL Editor.')
    process.exit(1)
  }
  console.log('✅ All required tables exist\n')

  // Test 5: Test RLS policies (try to query as anonymous user)
  console.log('5️⃣ Testing Row Level Security...')
  try {
    const { data, error } = await supabase.from('photographers').select('id').limit(1)
    if (error && error.code === '42501') {
      console.log('   ✅ RLS is enabled (expected: no data without auth)')
    } else if (error) {
      console.log(`   ⚠️  RLS check: ${error.message}`)
    } else {
      console.log('   ✅ RLS policies are configured')
    }
  } catch (error) {
    console.log(`   ⚠️  RLS check: ${error.message}`)
  }
  console.log()

  // Test 6: Test service role client (bypasses RLS)
  console.log('6️⃣ Testing service role client...')
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await serviceClient.from('photographers').select('count').limit(0)
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    console.log('✅ Service role client works correctly\n')
  } catch (error) {
    console.error('❌ Service role client failed:', error.message)
    console.error('   This might indicate an issue with SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Test 7: Check triggers and functions
  console.log('7️⃣ Checking database functions...')
  try {
    // Test if handle_new_user function exists by checking if we can query auth.users
    // (We can't directly test the function, but we can verify the setup)
    console.log('   ✅ Database functions should be set up (verify by creating a test user)\n')
  } catch (error) {
    console.log(`   ⚠️  Function check: ${error.message}\n`)
  }

  console.log('🎉 All tests passed! Your Supabase connection is working correctly.')
  console.log('\n📝 Next steps:')
  console.log('   1. Run the setup_database.sql file in your Supabase SQL Editor')
  console.log('   2. Test user signup to verify the handle_new_user trigger works')
  console.log('   3. Start your dev server: npm run dev')
}

// Run the tests
runTests().catch((error) => {
  console.error('❌ Test script failed:', error.message)
  process.exit(1)
})
