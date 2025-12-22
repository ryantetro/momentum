#!/usr/bin/env node

/**
 * Test trigger and check what error might be occurring
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
  console.log('🧪 Testing trigger with detailed logging...\n')

  const testEmail = `trigger-test-${Date.now()}@test.com`
  
  // First, let's manually test what username would be generated
  const baseUsername = testEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 25)
  console.log(`Expected username pattern: ${baseUsername}\n`)

  // Create user
  console.log('1️⃣ Creating user...')
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: 'Test123!',
    email_confirm: true,
  })

  if (userError) {
    console.error('❌ User creation failed:', userError.message)
    return
  }

  console.log(`   ✅ User created: ${userData.user.id}`)
  
  // Wait for trigger
  console.log('\n2️⃣ Waiting for trigger to execute...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Check photographer
  console.log('\n3️⃣ Checking photographer...')
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

  console.log(`   ✅ Photographer found: ${photographer.id}`)
  console.log(`   Email: ${photographer.email}`)
  console.log(`   Username: ${photographer.username || 'NULL'}`)
  
  if (!photographer.username) {
    console.log('\n❌ Username is NULL')
    console.log('   The trigger is likely hitting an exception and falling back')
    console.log('   Check your Supabase Postgres Logs for the actual error')
    console.log('   The error should show what went wrong in the trigger')
  } else {
    console.log('\n✅ Username was set!')
  }
  
  // Try to manually set username to see if there's a constraint issue
  if (!photographer.username) {
    console.log('\n4️⃣ Testing manual username update...')
    const testUsername = 'test-' + Date.now()
    const { data: updated, error: updateError } = await adminClient
      .from('photographers')
      .update({ username: testUsername })
      .eq('id', photographer.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('   ❌ Manual update failed:', updateError.message)
      console.error('   Code:', updateError.code)
    } else {
      console.log(`   ✅ Manual update worked: ${updated.username}`)
      // Revert it
      await adminClient.from('photographers').update({ username: null }).eq('id', photographer.id)
    }
  }
  
  // Clean up
  await adminClient.from('photographers').delete().eq('id', photographer.id)
  await adminClient.auth.admin.deleteUser(userData.user.id)
  console.log('\n✅ Test complete')
}

testTrigger()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  })



