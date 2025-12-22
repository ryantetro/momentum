#!/bin/bash

# Stripe Integration Test Script
# This script helps test the complete Stripe integration workflow

echo "🧪 Stripe Integration Test"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Please install it first:"
    echo "   brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "✅ Stripe CLI found: $(stripe --version)"
echo ""

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "⚠️  Not logged in to Stripe CLI"
    echo "   Run: stripe login"
    exit 1
fi

echo "✅ Logged in to Stripe"
echo ""

# Check if dev server is running
if ! lsof -ti:3000 &> /dev/null; then
    echo "⚠️  Dev server not running on port 3000"
    echo "   Start it with: npm run dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

echo "📋 Setup Instructions:"
echo "───────────────────────────────────────────────────────────"
echo ""
echo "1. In a SEPARATE terminal, start the webhook listener:"
echo "   stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo ""
echo "2. Copy the webhook signing secret (starts with whsec_)"
echo ""
echo "3. Add it to your .env.local file:"
echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "4. Restart your dev server to load the new env variable"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

read -p "Have you completed the setup above? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Please complete the setup steps first."
    exit 1
fi

echo ""
echo "🚀 Testing Webhook Events"
echo "───────────────────────────────────────────────────────────"
echo ""
echo "Note: These test events will have mock data."
echo "For real testing, you'll need to create actual bookings in your app."
echo ""

# Test checkout.session.completed
echo "1️⃣  Testing checkout.session.completed event..."
echo "   Run this in your webhook listener terminal:"
echo "   stripe trigger checkout.session.completed"
echo ""

# Test payment_intent.succeeded
echo "2️⃣  Testing payment_intent.succeeded event..."
echo "   Run this in your webhook listener terminal:"
echo "   stripe trigger payment_intent.succeeded"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ Check your dev server logs for webhook processing!"
echo "✅ Check your database to verify booking updates!"
echo ""



