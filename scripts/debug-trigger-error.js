#!/usr/bin/env node

/**
 * Debug the trigger error by testing the function directly
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

async function debugTrigger() {
  console.log('🔍 Debugging trigger error...\n')

  // Step 1: Test username generation
  console.log('1️⃣ Testing username generation function...')
  const testEmails = [
    'test@example.com',
    'john.doe@test.com',
    'jane+test@example.com',
  ]
  
  for (const email of testEmails) {
    const { data: username, error } = await adminClient.rpc('generate_unique_username', {
      email_address: email
    })
    if (error) {
      console.error(`   ❌ Error generating username for ${email}:`, error.message)
    } else {
      console.log(`   ✅ ${email} -> ${username}`)
    }
  }
  console.log()

  // Step 2: Check if there are existing photographers with usernames
  console.log('2️⃣ Checking existing photographers...')
  const { data: existing, error: existingError } = await adminClient
    .from('photographers')
    .select('id, email, username')
    .limit(5)
  
  if (existingError) {
    console.error('   ❌ Error:', existingError.message)
  } else {
    console.log(`   Found ${existing.length} photographers`)
    existing.forEach(p => {
      console.log(`   - ${p.email}: ${p.username || 'NULL'}`)
    })
  }
  console.log()

  // Step 3: Try to manually simulate what the trigger does
  console.log('3️⃣ Simulating trigger function manually...')
  const testEmail = `debug-${Date.now()}@test.com`
  
  // First create user
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: 'Test123!',
    email_confirm: true,
  })

  if (userError) {
    console.error('   ❌ User creation failed:', userError.message)
    console.error('   Full error:', JSON.stringify(userError, null, 2))
    
    // Check Supabase logs - we can't access them directly, but we can try to understand
    // The error might be in the trigger function itself
    console.log('\n   💡 The error is likely in the trigger function.')
    console.log('   Check your Supabase dashboard -> Logs -> Postgres Logs')
    console.log('   for the actual database error message.\n')
    return
  }

  console.log(`   ✅ User created: ${userData.user.id}`)
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Check if photographer was created
  const { data: photographer, error: photoError } = await adminClient
    .from('photographers')
    .select('*')
    .eq('user_id', userData.user.id)
    .single()

  if (photoError || !photographer) {
    console.error('   ❌ Photographer NOT created by trigger')
    console.error('   Error:', photoError?.message || 'Not found')
    
    // Try to manually create it to see what error we get
    console.log('\n   Attempting manual creation to see error...')
    const { data: username } = await adminClient.rpc('generate_unique_username', {
      email_address: testEmail
    })
    
    console.log(`   Generated username: ${username}`)
    
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
      console.error('   ❌ Manual insert error:', manualError.message)
      console.error('   Code:', manualError.code)
      console.error('   Details:', JSON.stringify(manualError, null, 2))
    } else {
      console.log('   ✅ Manual insert worked!')
      console.log('   This confirms the trigger function is the issue')
      // Clean up
      await adminClient.from('photographers').delete().eq('id', manualPhoto.id)
    }
  } else {
    console.log('   ✅ Photographer created by trigger!')
    console.log(`   ID: ${photographer.id}`)
    console.log(`   Username: ${photographer.username}`)
    // Clean up
    await adminClient.from('photographers').delete().eq('id', photographer.id)
  }
  
  // Clean up user
  await adminClient.auth.admin.deleteUser(userData.user.id)
  console.log('\n✅ Debug complete')
}

debugTrigger()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Debug failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  })

