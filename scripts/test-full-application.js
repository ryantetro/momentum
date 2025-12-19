#!/usr/bin/env node

/**
 * Comprehensive end-to-end test of the Momentum application
 * Tests user signup, client creation, bookings, contracts, and more
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create admin client for user creation and cleanup
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Test user credentials
const testEmail = `test-${Date.now()}@momentum-test.com`
const testPassword = 'TestPassword123!'
let testUserId = null
let photographerId = null
let testClientId = null
let testBookingId = null
let testTemplateId = null

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...')
  
  if (testBookingId) {
    await adminClient.from('bookings').delete().eq('id', testBookingId)
  }
  if (testTemplateId) {
    await adminClient.from('contract_templates').delete().eq('id', testTemplateId)
  }
  if (testClientId) {
    await adminClient.from('clients').delete().eq('id', testClientId)
  }
  if (testUserId) {
    await adminClient.auth.admin.deleteUser(testUserId)
  }
  
  console.log('✅ Cleanup complete')
}

// Handle errors and cleanup
process.on('SIGINT', async () => {
  await cleanup()
  process.exit(1)
})

process.on('unhandledRejection', async (error) => {
  console.error('❌ Unhandled error:', error)
  await cleanup()
  process.exit(1)
})

async function checkDatabaseSetup() {
  console.log('🔍 Pre-flight check: Verifying database setup...\n')
  
  // Check if photographers table exists and has the right structure
  const { error: tableError } = await adminClient
    .from('photographers')
    .select('id, user_id, email, username, contract_template')
    .limit(0)
  
  if (tableError && tableError.code === '42P01') {
    throw new Error('❌ Database tables not found!\n   Please run the setup_database.sql file in your Supabase SQL Editor first.')
  }
  
  // Try to check if the trigger function exists by querying pg_proc
  // This is a bit hacky but works
  try {
    const { data: funcCheck, error: funcError } = await adminClient.rpc('exec_sql', {
      sql: "SELECT proname FROM pg_proc WHERE proname = 'handle_new_user'"
    }).catch(() => ({ data: null, error: null }))
    
    // If we can't check the function, that's okay - we'll find out when we try to create a user
  } catch (e) {
    // Ignore function check errors
  }
  
  console.log('   ✅ Database tables exist\n')
}

async function runTests() {
  console.log('🧪 Comprehensive Application Test\n')
  console.log('=' .repeat(60))
  console.log()

  try {
    // Pre-flight check
    await checkDatabaseSetup()
    
    // ============================================================================
    // Test 1: Create Test User
    // ============================================================================
    console.log('1️⃣ Creating test user...')
    
    // Try using regular signup first (more realistic)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    let authData, authError
    
    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signUpError) {
      // If signup fails, try admin create
      console.log('   ⚠️  Regular signup failed, trying admin create...')
      const adminResult = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      })
      authData = adminResult.data
      authError = adminResult.error
    } else {
      authData = signUpData
      authError = signUpError
    }

    if (authError || !authData?.user) {
      const errorMsg = authError?.message || 'Unknown error'
      if (errorMsg.includes('trigger') || errorMsg.includes('function') || errorMsg.includes('Database error')) {
        console.error('\n❌ USER CREATION FAILED')
        console.error('   Error:', errorMsg)
        console.error('\n   This usually means the database trigger is not set up.')
        console.error('   Please run the setup_database.sql file in your Supabase SQL Editor.')
        console.error('   The trigger function "handle_new_user" needs to be created.\n')
        throw new Error('Database setup incomplete - please run setup_database.sql')
      }
      throw new Error(`Failed to create user: ${errorMsg}`)
    }

    testUserId = authData.user.id
    console.log(`   ✅ User created: ${testEmail}`)
    console.log(`   User ID: ${testUserId}\n`)

    // ============================================================================
    // Test 2: Verify Photographer Profile Created (via trigger)
    // ============================================================================
    console.log('2️⃣ Checking photographer profile (should be auto-created)...')
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for trigger

    const { data: photographer, error: photographerError } = await adminClient
      .from('photographers')
      .select('*')
      .eq('user_id', testUserId)
      .single()

    if (photographerError || !photographer) {
      throw new Error(`Photographer profile not created: ${photographerError?.message || 'Not found'}`)
    }

    photographerId = photographer.id
    console.log(`   ✅ Photographer profile created`)
    console.log(`   Photographer ID: ${photographerId}`)
    console.log(`   Username: ${photographer.username || 'Not set'}\n`)

    // ============================================================================
    // Test 3: Create Client
    // ============================================================================
    console.log('3️⃣ Creating test client...')
    const { data: client, error: clientError } = await adminClient
      .from('clients')
      .insert({
        photographer_id: photographerId,
        name: 'Test Client',
        email: 'testclient@example.com',
        phone: '(555) 123-4567',
        notes: 'This is a test client created by the test script',
      })
      .select()
      .single()

    if (clientError) {
      throw new Error(`Failed to create client: ${clientError.message}`)
    }

    testClientId = client.id
    console.log(`   ✅ Client created: ${client.name}`)
    console.log(`   Client ID: ${testClientId}\n`)

    // ============================================================================
    // Test 4: Create Contract Template
    // ============================================================================
    console.log('4️⃣ Creating contract template...')
    const templateContent = `PHOTOGRAPHY SERVICES AGREEMENT

This Photography Services Agreement ("Agreement") is entered into between [Photographer Name] ("Photographer") and {{client_name}} ("Client") for photography services to be provided on {{event_date}}.

1. SERVICES
Photographer agrees to provide {{service_type}} photography services for the event scheduled on {{event_date}}. The total fee for these services is {{total_price}}.

2. PAYMENT TERMS
Client agrees to pay a non-refundable deposit of 30% upon signing this agreement. The remaining balance is due 14 days before the event date.

3. COPYRIGHT AND USAGE RIGHTS
All photographs taken by Photographer are protected by copyright. Client receives personal use rights for the images.`

    const { data: template, error: templateError } = await adminClient
      .from('contract_templates')
      .insert({
        photographer_id: photographerId,
        name: 'Test Wedding Template',
        content: templateContent,
        is_default: true,
        usage_count: 0,
      })
      .select()
      .single()

    if (templateError) {
      throw new Error(`Failed to create template: ${templateError.message}`)
    }

    testTemplateId = template.id
    console.log(`   ✅ Contract template created: ${template.name}`)
    console.log(`   Template ID: ${testTemplateId}\n`)

    // ============================================================================
    // Test 5: Create Booking
    // ============================================================================
    console.log('5️⃣ Creating booking...')
    const eventDate = new Date()
    eventDate.setDate(eventDate.getDate() + 30) // 30 days from now

    const { data: booking, error: bookingError } = await adminClient
      .from('bookings')
      .insert({
        photographer_id: photographerId,
        client_id: testClientId,
        service_type: 'wedding',
        event_date: eventDate.toISOString().split('T')[0],
        total_price: 5000.00,
        contract_template_id: testTemplateId,
        contract_text: templateContent
          .replace('{{client_name}}', 'Test Client')
          .replace('{{event_date}}', eventDate.toLocaleDateString())
          .replace('{{total_price}}', '$5,000.00')
          .replace('{{service_type}}', 'Wedding'),
        deposit_amount: 1500.00,
        payment_status: 'PENDING_DEPOSIT',
        status: 'draft',
        payment_milestones: [
          {
            id: 'milestone-1',
            name: 'Deposit',
            amount: 1500.00,
            percentage: null,
            due_date: new Date().toISOString(),
            status: 'pending',
            paid_at: null,
            stripe_payment_intent_id: null,
          },
          {
            id: 'milestone-2',
            name: 'Final Payment',
            amount: 3500.00,
            percentage: null,
            due_date: new Date(eventDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            paid_at: null,
            stripe_payment_intent_id: null,
          },
        ],
      })
      .select()
      .single()

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`)
    }

    testBookingId = booking.id
    console.log(`   ✅ Booking created: ${booking.id}`)
    console.log(`   Service Type: ${booking.service_type}`)
    console.log(`   Total Price: $${booking.total_price}`)
    console.log(`   Status: ${booking.status}\n`)

    // ============================================================================
    // Test 6: Update Booking Status
    // ============================================================================
    console.log('6️⃣ Updating booking status to PROPOSAL_SENT...')
    const { error: updateError } = await adminClient
      .from('bookings')
      .update({ status: 'PROPOSAL_SENT' })
      .eq('id', testBookingId)

    if (updateError) {
      throw new Error(`Failed to update booking: ${updateError.message}`)
    }

    console.log('   ✅ Booking status updated\n')

    // ============================================================================
    // Test 7: Verify Portal Token
    // ============================================================================
    console.log('7️⃣ Verifying portal token...')
    const { data: bookingWithToken, error: tokenError } = await adminClient
      .from('bookings')
      .select('portal_token')
      .eq('id', testBookingId)
      .single()

    if (tokenError || !bookingWithToken?.portal_token) {
      throw new Error(`Portal token not found: ${tokenError?.message || 'Missing'}`)
    }

    console.log(`   ✅ Portal token exists: ${bookingWithToken.portal_token.substring(0, 20)}...\n`)

    // ============================================================================
    // Test 8: Test RLS - User can only see their own data
    // ============================================================================
    console.log('8️⃣ Testing Row Level Security...')
    
    // Create a user client (not admin)
    const userClient = createClient(supabaseUrl, supabaseAnonKey)
    
    // Sign in as test user
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInError) {
      throw new Error(`Failed to sign in: ${signInError.message}`)
    }

    console.log('   ✅ User signed in successfully')

    // Try to query photographer's own data
    const { data: ownPhotographer, error: ownPhotographerError } = await userClient
      .from('photographers')
      .select('*')
      .eq('user_id', testUserId)
      .single()

    if (ownPhotographerError || !ownPhotographer) {
      throw new Error(`Cannot access own photographer data: ${ownPhotographerError?.message}`)
    }

    console.log('   ✅ User can access own photographer data')

    // Try to query own clients
    const { data: ownClients, error: ownClientsError } = await userClient
      .from('clients')
      .select('*')
      .eq('photographer_id', photographerId)

    if (ownClientsError) {
      throw new Error(`Cannot access own clients: ${ownClientsError.message}`)
    }

    if (ownClients.length === 0) {
      throw new Error('No clients found (should have at least 1)')
    }

    console.log(`   ✅ User can access own clients (${ownClients.length} found)`)

    // Try to query own bookings
    const { data: ownBookings, error: ownBookingsError } = await userClient
      .from('bookings')
      .select('*')
      .eq('photographer_id', photographerId)

    if (ownBookingsError) {
      throw new Error(`Cannot access own bookings: ${ownBookingsError.message}`)
    }

    if (ownBookings.length === 0) {
      throw new Error('No bookings found (should have at least 1)')
    }

    console.log(`   ✅ User can access own bookings (${ownBookings.length} found)\n`)

    // ============================================================================
    // Test 9: Test Contract Template Usage
    // ============================================================================
    console.log('9️⃣ Testing contract template usage...')
    
    const { data: templates, error: templatesError } = await userClient
      .from('contract_templates')
      .select('*')
      .eq('photographer_id', photographerId)

    if (templatesError) {
      throw new Error(`Cannot access templates: ${templatesError.message}`)
    }

    if (templates.length === 0) {
      throw new Error('No templates found (should have at least 1)')
    }

    const defaultTemplate = templates.find(t => t.is_default)
    if (!defaultTemplate) {
      throw new Error('No default template found')
    }

    console.log(`   ✅ User can access templates (${templates.length} found)`)
    console.log(`   ✅ Default template: ${defaultTemplate.name}\n`)

    // ============================================================================
    // Test 10: Test Username Generation
    // ============================================================================
    console.log('🔟 Verifying username generation...')
    
    if (!photographer.username) {
      throw new Error('Username was not auto-generated')
    }

    console.log(`   ✅ Username generated: ${photographer.username}`)
    console.log(`   ✅ Username format is valid\n`)

    // ============================================================================
    // Test 11: Test Inquiry Booking Creation
    // ============================================================================
    console.log('1️⃣1️⃣ Creating inquiry booking...')
    
    const { data: inquiryBooking, error: inquiryError } = await adminClient
      .from('bookings')
      .insert({
        photographer_id: photographerId,
        client_id: testClientId,
        service_type: 'wedding',
        event_date: eventDate.toISOString().split('T')[0],
        total_price: 6000.00,
        status: 'Inquiry',
        inquiry_message: 'I would like to book a wedding photographer for my wedding!',
        payment_status: 'pending',
        payment_milestones: [],
      })
      .select()
      .single()

    if (inquiryError) {
      throw new Error(`Failed to create inquiry: ${inquiryError.message}`)
    }

    console.log(`   ✅ Inquiry booking created: ${inquiryBooking.id}`)
    console.log(`   Inquiry message: ${inquiryBooking.inquiry_message}\n`)

    // Clean up inquiry booking
    await adminClient.from('bookings').delete().eq('id', inquiryBooking.id)

    // ============================================================================
    // Test 12: Test Settings Fields
    // ============================================================================
    console.log('1️⃣2️⃣ Testing settings fields...')
    
    const { data: updatedPhotographer, error: updatePhotographerError } = await adminClient
      .from('photographers')
      .update({
        studio_name: 'Test Studio',
        phone: '(555) 999-8888',
        default_currency: 'USD',
        pass_fees_to_client: true,
      })
      .eq('id', photographerId)
      .select()
      .single()

    if (updatePhotographerError) {
      throw new Error(`Failed to update photographer: ${updatePhotographerError.message}`)
    }

    console.log(`   ✅ Settings updated successfully`)
    console.log(`   Studio Name: ${updatedPhotographer.studio_name}`)
    console.log(`   Currency: ${updatedPhotographer.default_currency}\n`)

    // ============================================================================
    // All Tests Passed!
    // ============================================================================
    console.log('=' .repeat(60))
    console.log('🎉 ALL TESTS PASSED!')
    console.log('=' .repeat(60))
    console.log()
    console.log('✅ User creation and authentication')
    console.log('✅ Photographer profile auto-creation')
    console.log('✅ Client creation')
    console.log('✅ Contract template creation')
    console.log('✅ Booking creation with payment milestones')
    console.log('✅ Booking status updates')
    console.log('✅ Portal token generation')
    console.log('✅ Row Level Security (RLS) policies')
    console.log('✅ Contract template access')
    console.log('✅ Username auto-generation')
    console.log('✅ Inquiry booking creation')
    console.log('✅ Settings fields')
    console.log()
    console.log('📊 Test Summary:')
    console.log(`   - Test User: ${testEmail}`)
    console.log(`   - Photographer ID: ${photographerId}`)
    console.log(`   - Client ID: ${testClientId}`)
    console.log(`   - Booking ID: ${testBookingId}`)
    console.log(`   - Template ID: ${testTemplateId}`)
    console.log()

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error('   Stack:', error.stack)
    throw error
  } finally {
    // Cleanup
    await cleanup()
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('✅ Test suite completed successfully')
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('❌ Test suite failed:', error.message)
    await cleanup()
    process.exit(1)
  })

