#!/usr/bin/env node

/**
 * Verify Webhook Test Results
 * 
 * This script helps you verify that your webhook integration is working.
 */

console.log('🔍 Webhook Test Verification\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('What to Check:\n');

console.log('1️⃣  Webhook Listener Terminal (where stripe listen is running)');
console.log('   ───────────────────────────────────────────────────────────');
console.log('   Look for lines like:');
console.log('   ✅ --> checkout.session.completed [evt_xxxxx]');
console.log('   ✅ <--  [200] POST http://localhost:3000/api/stripe/webhook');
console.log('   ✅ --> payment_intent.succeeded [evt_xxxxx]');
console.log('   ✅ <--  [200] POST http://localhost:3000/api/stripe/webhook\n');

console.log('2️⃣  Dev Server Logs (where npm run dev is running)');
console.log('   ───────────────────────────────────────────────────────────');
console.log('   Look for:');
console.log('   ✅ POST /api/stripe/webhook 200 in XXms');
console.log('   ⚠️  OR errors like "Missing bookingId" (expected for test events)\n');

console.log('3️⃣  Expected Behavior');
console.log('   ───────────────────────────────────────────────────────────');
console.log('   The test events from `stripe trigger` are generic and don\'t have');
console.log('   the custom metadata (bookingId, type) that your webhook expects.');
console.log('   So you\'ll likely see:');
console.log('   ⚠️  "Missing bookingId in checkout session metadata"');
console.log('   This is NORMAL and expected for test events.\n');

console.log('4️⃣  Testing with Real Data');
console.log('   ───────────────────────────────────────────────────────────');
console.log('   To test with actual booking data, you need to:');
console.log('   1. Create a booking in your app');
console.log('   2. Get the booking ID and portal_token');
console.log('   3. Trigger a webhook with custom metadata:\n');
console.log('   stripe trigger checkout.session.completed \\');
console.log('     --override checkout_session:metadata[bookingId]=YOUR_BOOKING_ID \\');
console.log('     --override checkout_session:metadata[type]=deposit \\');
console.log('     --override checkout_session:metadata[photographerId]=YOUR_PHOTOGRAPHER_ID \\');
console.log('     --override checkout_session:metadata[baseAmount]=100.00 \\');
console.log('     --override checkout_session:metadata[transactionFee]=3.50 \\');
console.log('     --override checkout_session:amount_total=10350\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('✅ If you see [200] responses in the webhook listener, your integration is working!');
console.log('✅ The "Missing bookingId" errors are expected for generic test events.\n');

