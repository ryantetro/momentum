#!/usr/bin/env node

/**
 * Stripe Webhook Testing Script
 * 
 * This script helps test the Stripe webhook integration locally.
 * 
 * Prerequisites:
 * 1. Stripe CLI installed and logged in: `stripe login`
 * 2. Webhook listener running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 * 3. Dev server running: `npm run dev`
 * 
 * Usage:
 * 1. Start webhook listener in one terminal: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 * 2. Copy the webhook signing secret (starts with whsec_)
 * 3. Add it to .env.local as STRIPE_WEBHOOK_SECRET
 * 4. Run this script: `node scripts/test-stripe-webhook.js`
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🧪 Stripe Webhook Testing Guide\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Step 1: Start Webhook Listener');
console.log('───────────────────────────────────────────────────────────');
console.log('In a separate terminal, run:');
console.log('  stripe listen --forward-to localhost:3000/api/stripe/webhook\n');
console.log('Copy the webhook signing secret (starts with whsec_)');
console.log('Add it to your .env.local file as: STRIPE_WEBHOOK_SECRET=whsec_...\n');

console.log('Step 2: Test Webhook Events');
console.log('───────────────────────────────────────────────────────────');
console.log('In the terminal where stripe listen is running, trigger test events:\n');
console.log('  For deposit payment:');
console.log('    stripe trigger checkout.session.completed\n');
console.log('  For milestone payment:');
console.log('    stripe trigger payment_intent.succeeded\n');

console.log('Step 3: Verify in Your App');
console.log('───────────────────────────────────────────────────────────');
console.log('Check your dev server logs and database to verify:');
console.log('  ✓ Webhook events are received');
console.log('  ✓ Booking payment_status is updated');
console.log('  ✓ Booking status is updated correctly\n');

console.log('═══════════════════════════════════════════════════════════\n');

rl.question('Have you started the webhook listener and added the secret to .env.local? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\n✅ Great! Now you can trigger test events in your Stripe CLI terminal.\n');
    console.log('Test Commands:');
    console.log('  1. stripe trigger checkout.session.completed');
    console.log('  2. stripe trigger payment_intent.succeeded\n');
    console.log('Watch your dev server logs for webhook processing!\n');
  } else {
    console.log('\n⚠️  Please complete the setup steps above first.\n');
  }
  rl.close();
});

