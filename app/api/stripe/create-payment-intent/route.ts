import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"
import Stripe from "stripe"

const TRANSACTION_FEE_PERCENTAGE = 0.035 // 3.5%

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { bookingId, milestoneId, amount, type } = body

    // Handle deposit payment (Phase 5)
    if (type === "deposit") {
      if (!bookingId) {
        return NextResponse.json(
          { error: "Missing bookingId" },
          { status: 400 }
        )
      }

      // Get booking first
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single()

      if (bookingError || !booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        )
      }

      // Get photographer's Stripe account
      const { data: photographer, error: photographerError } = await supabase
        .from("photographers")
        .select("stripe_account_id")
        .eq("id", booking.photographer_id)
        .single()

      if (photographerError || !photographer) {
        return NextResponse.json(
          { error: "Photographer not found" },
          { status: 404 }
        )
      }

      if (!photographer.stripe_account_id) {
        return NextResponse.json(
          { error: "Photographer has not connected Stripe account. Please enable payments in settings." },
          { status: 400 }
        )
      }

      // Fetch deposit amount from booking, or calculate default (20% of total price)
      const depositAmount = booking.deposit_amount
        ? parseFloat(booking.deposit_amount.toString())
        : (typeof booking.total_price === 'number' ? booking.total_price : parseFloat(booking.total_price.toString())) * 0.2

      // Calculate amounts using inverse formula: Total = Amount / (1 - Fee)
      // This ensures that after Stripe/Platform take their cut, the photographer gets exactly depositAmount
      const totalAmount = depositAmount / (1 - TRANSACTION_FEE_PERCENTAGE)
      const momentumFee = totalAmount - depositAmount // Momentum platform fee is the difference

      // Create Stripe Checkout Session with Stripe Connect Direct Charges
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Photography Deposit",
              },
              unit_amount: Math.round(totalAmount * 100), // Total amount client pays (deposit + fee) in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/${booking.portal_token}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/${booking.portal_token}?payment=cancelled`,
        metadata: {
          bookingId,
          type: "deposit",
          photographerId: booking.photographer_id,
          baseAmount: depositAmount.toString(),
          transactionFee: momentumFee.toString(),
        },
        payment_intent_data: {
          application_fee_amount: Math.round(momentumFee * 100), // Momentum's 3.5% platform fee in cents
        },
      }

      // Create checkout session on the connected account (Direct Charges)
      const session = await stripe.checkout.sessions.create(
        sessionConfig,
        {
          stripeAccount: photographer.stripe_account_id,
        }
      )

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
        amount: totalAmount,
        baseAmount: depositAmount,
        transactionFee: momentumFee,
      })
    }

    // Handle milestone payment (existing functionality)
    if (!bookingId || !milestoneId) {
      return NextResponse.json(
        { error: "Missing bookingId or milestoneId" },
        { status: 400 }
      )
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Find milestone
    const milestones = booking.payment_milestones || []
    const milestone = milestones.find((m: any) => m.id === milestoneId)

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      )
    }

    if (milestone.status === "paid") {
      return NextResponse.json(
        { error: "Milestone already paid" },
        { status: 400 }
      )
    }

    // Get photographer's Stripe account ID
    const { data: photographer, error: photographerError } = await supabase
      .from("photographers")
      .select("stripe_account_id")
      .eq("id", booking.photographer_id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: "Photographer not found" },
        { status: 404 }
      )
    }

    if (!photographer.stripe_account_id) {
      return NextResponse.json(
        { error: "Photographer has not connected Stripe account. Please enable payments in settings." },
        { status: 400 }
      )
    }

    // Calculate amounts using inverse formula: Total = Amount / (1 - Fee)
    // This ensures that after Stripe/Platform take their cut, the photographer gets exactly milestoneAmount
    const milestoneAmount = milestone.amount // Base amount photographer should receive
    const totalAmount = milestoneAmount / (1 - TRANSACTION_FEE_PERCENTAGE)
    const momentumFee = totalAmount - milestoneAmount // Momentum platform fee is the difference

    // Create Stripe Checkout Session with Stripe Connect Direct Charges
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Payment for ${milestone.name}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Total amount client pays (milestone + fee) in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/${booking.portal_token}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/${booking.portal_token}?payment=cancelled`,
      metadata: {
        bookingId,
        milestoneId,
        type: "milestone",
        photographerId: booking.photographer_id,
        baseAmount: milestoneAmount.toString(),
        transactionFee: momentumFee.toString(),
      },
      payment_intent_data: {
        application_fee_amount: Math.round(momentumFee * 100), // Momentum's 3.5% platform fee in cents
      },
    }

    // Create checkout session on the connected account (Direct Charges)
    const session = await stripe.checkout.sessions.create(
      sessionConfig,
      {
        stripeAccount: photographer.stripe_account_id,
      }
    )

    // Update milestone with session ID
    const updatedMilestones = milestones.map((m: any) =>
      m.id === milestoneId
        ? { ...m, stripe_checkout_session_id: session.id }
        : m
    )

    await supabase
      .from("bookings")
      .update({ payment_milestones: updatedMilestones })
      .eq("id", bookingId)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      amount: totalAmount,
      baseAmount: milestoneAmount,
      transactionFee: momentumFee,
    })
  } catch (error: any) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 500 }
    )
  }
}

