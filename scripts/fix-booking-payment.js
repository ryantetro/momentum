const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBooking() {
    const bookingId = '0ac6d143-f6e4-474d-b929-b316d28311d2';
    console.log(`Fixing booking: ${bookingId}...`);

    // 1. Fetch current booking
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

    if (fetchError || !booking) {
        console.error('Error fetching booking:', fetchError);
        return;
    }

    // 2. Identify the Deposit Milestone
    let milestones = booking.payment_milestones || [];
    let depositFound = false;

    const updatedMilestones = milestones.map(m => {
        if (m.name === 'Deposit') {
            depositFound = true;
            if (m.status === 'paid') {
                console.log('Deposit milestone is already paid.');
                return m;
            }
            return {
                ...m,
                status: 'paid',
                paid_at: new Date().toISOString(),
                note: 'Manually fixed via script'
            };
        }
        return m;
    });

    if (!depositFound) {
        console.warn('Warning: No milestone named "Deposit" found.');
        // Check if we should fallback to ID or purely payment_status
    }

    // 3. Update the Booking
    const { data: updated, error: updateError } = await supabase
        .from('bookings')
        .update({
            payment_status: 'DEPOSIT_PAID',
            status: 'Active', // Assuming deposit moves it to Active
            payment_milestones: updatedMilestones
        })
        .eq('id', bookingId)
        .select()
        .single();

    if (updateError) {
        console.error('Failed to update booking:', updateError);
    } else {
        console.log('✅ Booking updated successfully!');
        console.log('New Payment Status:', updated.payment_status);
        console.log('Milestones:', JSON.stringify(updated.payment_milestones, null, 2));
    }
}

fixBooking();
