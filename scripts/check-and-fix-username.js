#!/usr/bin/env node

/**
 * Check and fix username for existing photographers
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

async function checkAndFixUsernames() {
  console.log('🔍 Checking photographers without usernames...\n')

  // Get all photographers
  const { data: photographers, error } = await adminClient
    .from('photographers')
    .select('id, email, username, user_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching photographers:', error.message)
    return
  }

  console.log(`Found ${photographers.length} photographers\n`)

  let updated = 0
  let alreadyHaveUsername = 0

  for (const photographer of photographers) {
    if (photographer.username) {
      console.log(`✅ ${photographer.email}: ${photographer.username}`)
      alreadyHaveUsername++
    } else {
      // Generate username from email
      const baseUsername = photographer.email.split('@')[0].toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 25)
      const username = baseUsername + '-' + photographer.id.substring(0, 8)

      const { error: updateError } = await adminClient
        .from('photographers')
        .update({ username })
        .eq('id', photographer.id)

      if (updateError) {
        console.error(`❌ Failed to update ${photographer.email}:`, updateError.message)
      } else {
        console.log(`✅ Generated username for ${photographer.email}: ${username}`)
        updated++
      }
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   - Already have username: ${alreadyHaveUsername}`)
  console.log(`   - Generated usernames: ${updated}`)
  console.log(`   - Total: ${photographers.length}`)
}

checkAndFixUsernames()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error.message)
    process.exit(1)
  })



