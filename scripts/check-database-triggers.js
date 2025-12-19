#!/usr/bin/env node

/**
 * Diagnostic script to check if database triggers and functions are set up correctly
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

async function checkTriggers() {
  console.log('🔍 Checking database triggers and functions...\n')

  // Check if handle_new_user function exists
  console.log('1️⃣ Checking handle_new_user function...')
  try {
    const { data, error } = await adminClient.rpc('exec_sql', {
      query: `
        SELECT 
          proname as function_name,
          prosrc as function_body
        FROM pg_proc 
        WHERE proname = 'handle_new_user'
      `
    })
    
    if (error) {
      // Try alternative method
      const { data: altData, error: altError } = await adminClient
        .from('_prisma_migrations')
        .select('*')
        .limit(0)
        .catch(() => ({ data: null, error: null }))
      
      // Direct SQL query using PostgREST
      console.log('   ⚠️  Cannot directly query pg_proc via Supabase client')
      console.log('   Let\'s check if the trigger works by testing user creation...\n')
    } else if (data && data.length > 0) {
      console.log('   ✅ handle_new_user function exists')
      console.log(`   Function body length: ${data[0].function_body?.length || 0} characters\n`)
    } else {
      console.log('   ❌ handle_new_user function NOT FOUND\n')
      console.log('   Please ensure you ran the setup_database.sql file completely.')
      return
    }
  } catch (error) {
    console.log('   ⚠️  Could not check function directly:', error.message)
  }

  // Check if trigger exists by looking at pg_trigger
  console.log('2️⃣ Checking on_auth_user_created trigger...')
  try {
    // We can't directly query pg_trigger, but we can test if it works
    console.log('   Testing trigger by attempting to create a test user...\n')
    
    const testEmail = `diagnostic-${Date.now()}@test.com`
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'Test123!',
      email_confirm: true,
    })

    if (userError) {
      console.log(`   ❌ User creation failed: ${userError.message}`)
      console.log(`   Error details:`, JSON.stringify(userError, null, 2))
      
      // Check if photographer was created anyway
      if (userData?.user?.id) {
        const { data: photographer } = await adminClient
          .from('photographers')
          .select('*')
          .eq('user_id', userData.user.id)
          .single()
        
        if (photographer) {
          console.log('   ✅ Photographer profile WAS created (trigger worked!)')
          console.log(`   Photographer ID: ${photographer.id}`)
          // Clean up
          await adminClient.from('photographers').delete().eq('id', photographer.id)
          await adminClient.auth.admin.deleteUser(userData.user.id)
        } else {
          console.log('   ❌ Photographer profile was NOT created (trigger failed)')
        }
      }
    } else if (userData?.user) {
      console.log('   ✅ User created successfully')
      
      // Wait a moment for trigger to fire
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if photographer was created
      const { data: photographer, error: photoError } = await adminClient
        .from('photographers')
        .select('*')
        .eq('user_id', userData.user.id)
        .single()
      
      if (photographer) {
        console.log('   ✅ Photographer profile created automatically!')
        console.log(`   Photographer ID: ${photographer.id}`)
        console.log(`   Email: ${photographer.email}`)
        console.log(`   Username: ${photographer.username || 'Not set'}`)
        
        // Clean up
        await adminClient.from('photographers').delete().eq('id', photographer.id)
        await adminClient.auth.admin.deleteUser(userData.user.id)
        console.log('   ✅ Test user cleaned up\n')
      } else {
        console.log('   ❌ Photographer profile was NOT created')
        console.log(`   Error: ${photoError?.message || 'Not found'}`)
        
        // Clean up
        await adminClient.auth.admin.deleteUser(userData.user.id)
      }
    }
  } catch (error) {
    console.log(`   ❌ Error during trigger test: ${error.message}`)
    console.log(`   Stack: ${error.stack}`)
  }

  console.log('\n3️⃣ Checking generate_unique_username function...')
  try {
    // Test the function by calling it
    const { data: usernameData, error: usernameError } = await adminClient.rpc('generate_unique_username', {
      email_address: 'test@example.com'
    })
    
    if (usernameError) {
      console.log(`   ❌ Function error: ${usernameError.message}`)
    } else {
      console.log(`   ✅ Function works! Generated username: ${usernameData}`)
    }
  } catch (error) {
    console.log(`   ⚠️  Could not test function: ${error.message}`)
  }
}

checkTriggers()
  .then(() => {
    console.log('\n✅ Diagnostic complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error.message)
    process.exit(1)
  })

