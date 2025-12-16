import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"

const TRANSACTION_FEE_PERCENTAGE = 0.035 // 3.5%

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { bookingId, milestoneId, amount, type } = body

    // Handle deposit payment (Phase 5)
    if (type === "deposit") {
      if (!bookingId || !amount) {
        return NextResponse.json(
          { error: "Missing bookingId or amount" },
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

      // Calculate amounts
      const baseAmount = parseFloat(amount)
      const momentumFee = baseAmount * TRANSACTION_FEE_PERCENTAGE // 3.5% Momentum fee
      // Client pays: baseAmount + momentumFee
      // Photographer receives: baseAmount (exactly what they invoiced)
      const totalAmount = baseAmount + momentumFee

      // Create Stripe Checkout Session with Stripe Connect
      const sessionConfig: any = {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Deposit Payment - ${booking.service_type}`,
                description: `Deposit for booking on ${new Date(booking.event_date).toLocaleDateString()}`,
              },
              unit_amount: Math.round(totalAmount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/${booking.portal_token}?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/${booking.portal_token}?payment=cancelled`,
        metadata: {
          bookingId,
          type: "deposit",
          photographerId: booking.photographer_id,
          baseAmount: baseAmount.toString(),
          transactionFee: momentumFee.toString(),
        },
        payment_intent_data: {
          application_fee_amount: Math.round(momentumFee * 100), // Momentum's 3.5% fee in cents
          on_behalf_of: photographer.stripe_account_id,
          transfer_data: {
            destination: photographer.stripe_account_id,
          },
        },
      }

      const session = await stripe.checkout.sessions.create(sessionConfig)

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
        amount: totalAmount,
        baseAmount,
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

    // Calculate amounts
    const baseAmount = milestone.amount
    const momentumFee = baseAmount * TRANSACTION_FEE_PERCENTAGE // 3.5% Momentum fee
    // Client pays: baseAmount + momentumFee
    // Photographer receives: baseAmount (exactly what they invoiced)
    const totalAmount = baseAmount + momentumFee

    // Create payment intent with Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "usd",
      application_fee_amount: Math.round(momentumFee * 100), // Momentum's 3.5% fee in cents
      on_behalf_of: photographer.stripe_account_id,
      transfer_data: {
        destination: photographer.stripe_account_id,
      },
      metadata: {
        bookingId,
        milestoneId,
        photographerId: booking.photographer_id,
        baseAmount: baseAmount.toString(),
        transactionFee: momentumFee.toString(),
      },
    })

    // Update milestone with payment intent ID
    const updatedMilestones = milestones.map((m: any) =>
      m.id === milestoneId
        ? { ...m, stripe_payment_intent_id: paymentIntent.id }
        : m
    )

    await supabase
      .from("bookings")
      .update({ payment_milestones: updatedMilestones })
      .eq("id", bookingId)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      baseAmount,
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

