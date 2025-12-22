#!/bin/bash

# Script to start Stripe webhook listener
# This will forward webhook events to your local dev server

echo "🚀 Starting Stripe Webhook Listener"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if dev server is running
if ! lsof -ti:3000 &> /dev/null; then
    echo "⚠️  Dev server not running on port 3000"
    echo "   Please start it first: npm run dev"
    exit 1
fi

echo "✅ Dev server is running on port 3000"
echo ""

# Check if already running
if pgrep -f "stripe listen" > /dev/null; then
    echo "⚠️  Stripe webhook listener is already running"
    echo "   PID: $(pgrep -f 'stripe listen')"
    echo ""
    read -p "Kill existing listener and start new one? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "stripe listen"
        sleep 1
    else
        echo "Keeping existing listener running."
        exit 0
    fi
fi

echo "Starting webhook listener..."
echo ""
echo "📋 Important:"
echo "   - This will forward events to: http://localhost:3000/api/stripe/webhook"
echo "   - Copy the webhook signing secret (starts with whsec_)"
echo "   - Add it to .env.local as: STRIPE_WEBHOOK_SECRET=whsec_..."
echo "   - Press Ctrl+C to stop"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Start the listener
stripe listen --forward-to localhost:3000/api/stripe/webhook



