# Setting Up Stripe Test Keys

## Step 1: Access Stripe Dashboard

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Log in to your Stripe account

## Step 2: Switch to Test Mode

1. In the top right corner of the Stripe dashboard, you'll see a toggle that says **"Test mode"** or **"Live mode"**
2. Click the toggle to switch to **"Test mode"**
   - The toggle will turn gray/blue when in test mode
   - You'll see "Test mode" indicator in the top bar

## Step 3: Get Your Test Keys

1. In the left sidebar, click **"Developers"**
2. Click **"API keys"**
3. You'll see two keys:

   **Publishable key** (starts with `pk_test_...`)
   - This is safe to expose in your frontend code
   - Copy this key

   **Secret key** (starts with `sk_test_...`)
   - Click **"Reveal test key"** to see it
   - ⚠️ **Keep this secret!** Never commit it to version control
   - Copy this key

## Step 4: Update Your .env.local File

Open your `.env.local` file and update these lines:

```bash
# Replace with your TEST mode keys
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE
```

## Step 5: Restart Your Dev Server

After updating `.env.local`:
1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev`

## Step 6: Verify It's Working

1. Click "Enable Payments" in your app
2. It should now work without the HTTPS error!

## Important Notes

- **Test mode** is for development - no real charges are made
- **Live mode** is for production - real charges are made
- Test cards: Use `4242 4242 4242 4242` with any future expiry date and any CVC
- You can switch between test and live mode anytime in the Stripe dashboard
- Test and live mode have separate:
  - API keys
  - Connected accounts
  - Webhooks
  - Data

## Switching Back to Live Mode

When you're ready for production:
1. Switch to **"Live mode"** in Stripe dashboard
2. Get your **live** API keys (they start with `sk_live_` and `pk_live_`)
3. Update `.env.local` with live keys
4. Make sure your app URL uses HTTPS (required for live mode)



