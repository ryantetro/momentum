#!/usr/bin/env node

/**
 * Test username generation in trigger context
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

async function testUsername() {
  console.log('🧪 Testing username generation in trigger...\n')

  const testEmail = `username-test-${Date.now()}@test.com`
  
  // Create user
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: 'Test123!',
    email_confirm: true,
  })

  if (userError) {
    console.error('❌ User creation failed:', userError.message)
    return
  }

  console.log(`✅ User created: ${userData.user.id}`)
  
  // Wait for trigger
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Check photographer
  const { data: photographer, error: photoError } = await adminClient
    .from('photographers')
    .select('*')
    .eq('user_id', userData.user.id)
    .single()

  if (photoError || !photographer) {
    console.error('❌ Photographer not found:', photoError?.message)
    await adminClient.auth.admin.deleteUser(userData.user.id)
    return
  }

  console.log(`✅ Photographer created: ${photographer.id}`)
  console.log(`   Email: ${photographer.email}`)
  console.log(`   Username: ${photographer.username || 'NULL'}`)
  
  if (!photographer.username) {
    console.log('\n❌ Username is NULL - trigger function may not be setting it')
    console.log('   Testing username generation function directly...')
    
    const { data: generatedUsername, error: genError } = await adminClient.rpc('generate_unique_username', {
      email_address: testEmail
    })
    
    if (genError) {
      console.error('   ❌ Username generation failed:', genError.message)
    } else {
      console.log(`   ✅ Generated username: ${generatedUsername}`)
      console.log('   The function works, but the trigger may not be calling it correctly')
    }
  } else {
    console.log('✅ Username was generated!')
  }
  
  // Clean up
  await adminClient.from('photographers').delete().eq('id', photographer.id)
  await adminClient.auth.admin.deleteUser(userData.user.id)
  console.log('\n✅ Test complete')
}

testUsername()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  })

