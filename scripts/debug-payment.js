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

async function checkBooking() {
    const bookingId = '0ac6d143-f6e4-474d-b929-b316d28311d2';

    console.log(`Fetching booking: ${bookingId}...`);

    const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

    if (error) {
        console.error('Error fetching booking:', error);
        return;
    }

    console.log('\n--- Booking Data ---');
    console.log('ID:', booking.id);
    console.log('Status:', booking.status);
    console.log('Payment Status (Raw):', `"${booking.payment_status}"`); // Quote usage to see whitespace
    console.log('Total Price:', booking.total_price);
    console.log('Deposit Amount:', booking.deposit_amount);
    console.log('Deposit Amount Type:', typeof booking.deposit_amount);
    console.log('Payment Milestones:', JSON.stringify(booking.payment_milestones, null, 2));

    // Simulate the calculation logic
    const status = (booking.payment_status || "").toLowerCase();
    const milestones = booking.payment_milestones || [];

    const milestonesPaid = Array.isArray(milestones)
        ? milestones.reduce(
            (sum, m) => (m.status === "paid" ? sum + m.amount : sum),
            0
        )
        : 0;

    // Check if deposit is already included in milestones
    const hasPaidDepositMilestone = milestones.some(
        m => m.name === "Deposit" && m.status === "paid"
    );

    // Only add deposit_amount if it's NOT in the milestones
    const depositPaid = !hasPaidDepositMilestone && (status === "deposit_paid" || status === "paid" || status === "partial")
        ? (booking.deposit_amount || 0)
        : 0;

    let totalPaid = depositPaid + milestonesPaid;

    console.log('\n--- Calculation Simulation ---');
    console.log('Normalized Status:', status);
    console.log('Deposit Paid (Calculated):', depositPaid);
    console.log('Milestones Paid (Calculated):', milestonesPaid);
    console.log('Total Paid (Initial):', totalPaid);

    if (status === "paid" && totalPaid < booking.total_price) {
        console.log('>>> OVER RIDE TRIGGERED: Status is paid, forcing total to match price.');
        totalPaid = booking.total_price;
    } else {
        console.log('>>> Override NOT triggered.');
    }

    console.log('Total Paid (Final):', totalPaid);
    console.log('Balance Due:', Math.max(0, booking.total_price - totalPaid));
}

checkBooking();
