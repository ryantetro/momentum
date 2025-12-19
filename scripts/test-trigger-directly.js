#!/usr/bin/env node

/**
 * Test the trigger function directly to see what error it's producing
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testTrigger() {
  console.log('🧪 Testing trigger function directly...\n')

  // First, let's manually test the function
  console.log('1️⃣ Testing generate_unique_username function...')
  const { data: username, error: usernameError } = await adminClient.rpc('generate_unique_username', {
    email_address: 'testuser@example.com'
  })
  
  if (usernameError) {
    console.error('❌ Function error:', usernameError.message)
    return
  }
  console.log(`   ✅ Generated username: ${username}\n`)

  // Now test if we can manually insert a photographer
  console.log('2️⃣ Testing manual photographer insertion...')
  
  // Create a test user first
  const testEmail = `manual-test-${Date.now()}@test.com`
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: 'Test123!',
    email_confirm: true,
  })

  if (userError) {
    console.error('❌ User creation failed:', userError.message)
    console.error('   Full error:', JSON.stringify(userError, null, 2))
    return
  }

  console.log(`   ✅ User created: ${userData.user.id}`)
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Check if photographer was created
  const { data: photographer, error: photoError } = await adminClient
    .from('photographers')
    .select('*')
    .eq('user_id', userData.user.id)
    .single()

  if (photoError) {
    console.error('❌ Photographer not found:', photoError.message)
    
    // Try to manually create one to see what error we get
    console.log('\n3️⃣ Attempting manual photographer creation...')
    const { data: manualPhoto, error: manualError } = await adminClient
      .from('photographers')
      .insert({
        user_id: userData.user.id,
        email: testEmail,
        username: username,
      })
      .select()
      .single()
    
    if (manualError) {
      console.error('❌ Manual creation failed:', manualError.message)
      console.error('   Code:', manualError.code)
      console.error('   Details:', JSON.stringify(manualError, null, 2))
    } else {
      console.log('   ✅ Manual creation worked!')
      console.log('   This means the trigger function is the issue')
      // Clean up
      await adminClient.from('photographers').delete().eq('id', manualPhoto.id)
    }
  } else {
    console.log('   ✅ Photographer was created by trigger!')
    console.log(`   ID: ${photographer.id}`)
    console.log(`   Username: ${photographer.username}`)
    // Clean up
    await adminClient.from('photographers').delete().eq('id', photographer.id)
  }
  
  // Clean up user
  await adminClient.auth.admin.deleteUser(userData.user.id)
  console.log('\n✅ Test complete')
}

testTrigger()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  })

