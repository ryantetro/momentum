# 🧪 Stripe Integration Testing Guide

This guide will help you test the Stripe Direct Charges integration locally using the Stripe CLI.

## Prerequisites

1. ✅ Stripe CLI installed (`brew install stripe/stripe-cli/stripe`)
2. ✅ Logged in to Stripe CLI (`stripe login`)
3. ✅ Dev server running (`npm run dev`)
4. ✅ Environment variables set in `.env.local`

## Step 1: Start Webhook Listener

Open a **new terminal window** and run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**⚠️ IMPORTANT:** Copy the webhook signing secret (starts with `whsec_`)

## Step 2: Update Environment Variables

Add the webhook secret to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Restart your dev server** to load the new environment variable.

## Step 3: Test Webhook Events

In the terminal where `stripe listen` is running, trigger test events:

### Test 1: Deposit Payment (checkout.session.completed)

```bash
stripe trigger checkout.session.completed
```

**What to check:**
- ✅ Dev server logs show webhook received
- ✅ No errors in webhook processing
- ✅ Check database: booking `payment_status` should update

### Test 2: Milestone Payment (payment_intent.succeeded)

```bash
stripe trigger payment_intent.succeeded
```

**What to check:**
- ✅ Dev server logs show webhook received
- ✅ No errors in webhook processing

## Step 4: Test with Real Booking Data

For more realistic testing, you'll need to:

1. **Create a test booking** in your app with:
   - A photographer with a connected Stripe account
   - A client
   - A booking with `portal_token`

2. **Manually trigger webhook** with booking metadata:

```bash
stripe trigger checkout.session.completed \
  --override checkout_session:metadata[bookingId]=YOUR_BOOKING_ID \
  --override checkout_session:metadata[type]=deposit \
  --override checkout_session:metadata[photographerId]=YOUR_PHOTOGRAPHER_ID \
  --override checkout_session:metadata[baseAmount]=100.00 \
  --override checkout_session:metadata[transactionFee]=3.50 \
  --override checkout_session:amount_total=10350
```

## Troubleshooting

### Webhook signature verification failed
- ✅ Make sure `STRIPE_WEBHOOK_SECRET` is set correctly in `.env.local`
- ✅ Restart dev server after updating `.env.local`
- ✅ Use the secret from the `stripe listen` command (not from Stripe Dashboard)

### Webhook not received
- ✅ Check that `stripe listen` is running
- ✅ Verify dev server is running on port 3000
- ✅ Check the forward URL matches: `localhost:3000/api/stripe/webhook`

### Booking not updating
- ✅ Check webhook logs for errors
- ✅ Verify booking ID exists in database
- ✅ Check Supabase RLS policies allow updates

## Quick Test Script

Run the helper script:

```bash
./scripts/test-stripe-integration.sh
```

This will guide you through the testing process step by step.



