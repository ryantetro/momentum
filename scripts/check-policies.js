const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkPolicies() {
    const supabase = createClient(supabaseUrl, serviceKey)

    console.log('Checking RLS policies...')

    const { data, error } = await supabase.rpc('check_policies', {})

    if (error) {
        // If RPC doesn't exist, try querying pg_policies directly via a raw query if possible
        // But we can't do raw queries easily via the client.
        // Let's try to just list the policies using a common trick if enabled, 
        // or just assume we need to provide the SQL to the user.
        console.error('Error checking policies (RPC might not exist):', error.message)

        console.log('\nAttempting to query pg_policies via .from()...')
        const { data: policies, error: polError } = await supabase
            .from('pg_policies')
            .select('*')

        if (polError) {
            console.error('Could not query pg_policies directly:', polError.message)
        } else {
            console.log('Policies found:', policies)
        }
    } else {
        console.log('Policies:', data)
    }
}

checkPolicies()
