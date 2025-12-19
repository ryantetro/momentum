#!/usr/bin/env node

/**
 * Verification script to test public RLS access for portal data.
 * This script simulates an unauthenticated user (anonymous client)
 * attempting to fetch booking, client, and photographer data using a portal_token.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function verifyPortalAccess() {
    console.log('🧪 Verifying Portal Access (Anonymous Client)...\n')

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase environment variables.')
        process.exit(1)
    }

    // Create an anonymous client (no session)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })

    // 1. Find a valid portal_token to test with
    console.log('1️⃣ Finding a valid portal_token...')
    // We'll use the service role to find a token first, then test with anon client
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
        console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY for setup.')
        process.exit(1)
    }
    const serviceClient = createClient(supabaseUrl, serviceKey)

    const { data: testBooking, error: findError } = await serviceClient
        .from('bookings')
        .select('portal_token, id, client_id, photographer_id')
        .not('portal_token', 'is', null)
        .limit(1)
        .single()

    if (findError || !testBooking) {
        console.error('❌ Could not find a test booking with a portal_token:', findError?.message)
        process.exit(1)
    }

    const token = testBooking.portal_token
    console.log(`   Found token: ${token}\n`)

    // 2. Test fetching booking with anon client
    console.log('2️⃣ Testing booking fetch (Anon)...')
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*, client:clients(*)')
        .eq('portal_token', token)
        .single()

    if (bookingError) {
        console.error('❌ Failed to fetch booking anonymously:', bookingError.message)
    } else if (booking) {
        console.log('✅ Successfully fetched booking anonymously')
        console.log(`   Joined client present: ${!!booking.client}`)
        if (booking.client) {
            console.log(`   Client name: ${booking.client.name}`)
        }
    }

    // 3. Test fetching client with anon client
    console.log('\n3️⃣ Testing client fetch (Anon)...')
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', testBooking.client_id)
        .limit(1)
        .single()

    if (clientError) {
        console.error('❌ Failed to fetch client anonymously:', clientError.message)
        console.error('   Error details:', clientError)
        console.log('   (This is what we fixed with the new RLS policy)')
    } else if (client) {
        console.log(`✅ Successfully fetched client anonymously: ${client.name}`)
    }

    // 4. Test fetching photographer with anon client
    console.log('\n4️⃣ Testing photographer fetch (Anon)...')
    const { data: photographer, error: photographerError } = await supabase
        .from('photographers')
        .select('*')
        .eq('id', testBooking.photographer_id)
        .single()

    if (photographerError) {
        console.error('❌ Failed to fetch photographer anonymously:', photographerError.message)
        console.log('   (This is what we fixed with the new RLS policy)')
    } else if (photographer) {
        console.log(`✅ Successfully fetched photographer anonymously: ${photographer.business_name || photographer.email}`)
    }

    // 5. Debug: Call debug function
    console.log('\n🔍 Debug: Calling debug_portal_access RPC...')
    const { data: debugInfo, error: debugError } = await supabase.rpc('debug_portal_access', {
        test_client_id: testBooking.client_id,
        test_photo_id: testBooking.photographer_id
    })

    if (debugError) {
        console.error('   Error calling debug function (it might not be applied yet):', debugError.message)
    } else {
        console.log('   Debug Info:', debugInfo)
    }

    // 6. Debug: List all visible clients and photographers
    console.log('\n🔍 Debug: Listing all visible rows (Anon)...')
    const { data: allClients } = await supabase.from('clients').select('id, name')
    console.log(`   Visible clients: ${allClients?.length || 0}`)
    if (allClients && allClients.length > 0) {
        allClients.forEach(c => console.log(`     - ${c.name} (${c.id})`))
    }

    const { data: allPhotos } = await supabase.from('photographers').select('id, email')
    console.log(`   Visible photographers: ${allPhotos?.length || 0}`)
    if (allPhotos && allPhotos.length > 0) {
        allPhotos.forEach(p => console.log(`     - ${p.email} (${p.id})`))
    }

    console.log('\n🏁 Verification complete.')
}

verifyPortalAccess().catch(console.error)
