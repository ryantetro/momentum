#!/usr/bin/env node

/**
 * Check if the photographers table has all required columns
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

async function checkSchema() {
  console.log('🔍 Checking photographers table schema...\n')

  // Try to query with username field
  const { data, error } = await adminClient
    .from('photographers')
    .select('id, user_id, email, username, business_name, contract_template')
    .limit(1)

  if (error) {
    if (error.message.includes('username') || error.code === '42703') {
      console.error('❌ username column does not exist in photographers table!')
      console.error('   Error:', error.message)
      console.error('\n   You need to add the username column.')
      console.error('   Run this SQL in your Supabase SQL Editor:')
      console.error('   ALTER TABLE photographers ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;')
      return
    }
    console.error('❌ Error querying photographers:', error.message)
    return
  }

  console.log('✅ photographers table has all required columns')
  console.log('   Columns found: id, user_id, email, username, business_name, contract_template\n')

  // Now test if we can insert with username
  console.log('🧪 Testing insert with username...')
  
  const testEmail = `schema-test-${Date.now()}@test.com`
  const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: 'Test123!',
    email_confirm: true,
  })

  if (userError) {
    console.error('❌ User creation failed:', userError.message)
    
    // Try to see if we can manually insert
    if (userData?.user?.id) {
      console.log('\n   Attempting manual photographer insert...')
      const { data: manualPhoto, error: manualError } = await adminClient
        .from('photographers')
        .insert({
          user_id: userData.user.id,
          email: testEmail,
          username: 'testuser',
        })
        .select()
        .single()
      
      if (manualError) {
        console.error('❌ Manual insert failed:', manualError.message)
        console.error('   Code:', manualError.code)
        console.error('   Details:', JSON.stringify(manualError, null, 2))
      } else {
        console.log('✅ Manual insert worked!')
        console.log('   This means the trigger function has an issue')
        // Clean up
        await adminClient.from('photographers').delete().eq('id', manualPhoto.id)
      }
      
      // Clean up user
      await adminClient.auth.admin.deleteUser(userData.user.id)
    }
    return
  }

  console.log('✅ User created')
  
  // Wait for trigger
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const { data: photographer, error: photoError } = await adminClient
    .from('photographers')
    .select('*')
    .eq('user_id', userData.user.id)
    .single()

  if (photoError || !photographer) {
    console.error('❌ Photographer not created by trigger')
    console.error('   Error:', photoError?.message || 'Not found')
  } else {
    console.log('✅ Photographer created by trigger!')
    console.log(`   ID: ${photographer.id}`)
    console.log(`   Username: ${photographer.username || 'NULL'}`)
    console.log(`   Email: ${photographer.email}`)
    
    // Clean up
    await adminClient.from('photographers').delete().eq('id', photographer.id)
  }
  
  // Clean up user
  await adminClient.auth.admin.deleteUser(userData.user.id)
  
  console.log('\n✅ Schema check complete')
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Check failed:', error.message)
    process.exit(1)
  })

