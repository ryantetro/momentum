const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Env vars missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySchema() {
    console.log('Verifying schema for photographers table...');

    // Try to insert a dummy record with address fields OR select specific columns
    // Selecting is safer. If columns don't exist, it should throw error.
    const { data, error } = await supabase
        .from('photographers')
        .select('id, address, city, state, zip, country')
        .limit(1);

    if (error) {
        if (error.message.includes('does not exist')) {
            console.error('❌ Verification FAILED: Address columns do not exist yet.');
        } else {
            console.error('❌ Verification FAILED: Unexpected error:', error.message);
        }
    } else {
        console.log('✅ Verification PASSED: Address columns exist on photographers table.');
    }

    // Check clients table too
    console.log('Verifying schema for clients table...');
    const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, address, city, state, zip, country')
        .limit(1);

    if (clientError) {
        console.error('❌ Verification FAILED for Clients:', clientError.message);
    } else {
        console.log('✅ Verification PASSED: Address columns exist on clients table.');
    }
}

verifySchema();
