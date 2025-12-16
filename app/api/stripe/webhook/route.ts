import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe/client"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle checkout.session.completed for all payment types
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const bookingId = session.metadata?.bookingId
    const type = session.metadata?.type

    if (!bookingId) {
      console.error("Missing bookingId in checkout session metadata")
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 })
    }

    try {
      const supabase = await createClient()

      // Get booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single()

      if (bookingError || !booking) {
        console.error("Booking not found:", bookingId)
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        )
      }

      const baseAmount = parseFloat(session.metadata?.baseAmount || "0")
      const amountPaid = session.amount_total ? session.amount_total / 100 : baseAmount

      // Determine payment status based on amount paid vs total
      let paymentStatus = booking.payment_status
      let bookingStatus = booking.status

      if (type === "deposit") {
        // For deposits, mark as DEPOSIT_PAID
        paymentStatus = "DEPOSIT_PAID"
        bookingStatus = booking.status === "contract_signed" ? "payment_pending" : booking.status
      } else {
        // For full payments or milestones, check if fully paid
        const totalPaid = (booking.deposit_amount || 0) + amountPaid
        const totalPrice = booking.total_price

        if (totalPaid >= totalPrice) {
          paymentStatus = "paid"
          bookingStatus = "completed"
        } else if (totalPaid > 0) {
          paymentStatus = "partial"
        }
      }

      // Update booking payment status
      await supabase
        .from("bookings")
        .update({
          payment_status: paymentStatus,
          stripe_payment_intent_id: session.payment_intent || booking.stripe_payment_intent_id,
          status: bookingStatus,
        })
        .eq("id", bookingId)

      // Trigger notification
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payment_received",
            bookingId,
            amount: baseAmount,
          }),
        })
      } catch (notifError) {
        console.error("Failed to send notification:", notifError)
      }

      return NextResponse.json({ received: true })
    } catch (error: any) {
      console.error("Error processing checkout webhook:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any
    const { bookingId, milestoneId } = paymentIntent.metadata

    if (!bookingId || !milestoneId) {
      console.error("Missing metadata in payment intent")
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
    }

    try {
      const supabase = await createClient()

      // Get booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single()

      if (bookingError || !booking) {
        console.error("Booking not found:", bookingId)
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        )
      }

      // Update milestone status
      const milestones = booking.payment_milestones || []
      const updatedMilestones = milestones.map((m: any) =>
        m.id === milestoneId
          ? {
              ...m,
              status: "paid",
              paid_at: new Date().toISOString(),
            }
          : m
      )

      // Calculate payment status
      const paidAmount = updatedMilestones.reduce(
        (sum: number, m: any) => (m.status === "paid" ? sum + m.amount : sum),
        0
      )
      const totalAmount = milestones.reduce(
        (sum: number, m: any) => sum + m.amount,
        0
      )

      let paymentStatus = "pending"
      if (paidAmount >= totalAmount) {
        paymentStatus = "paid"
      } else if (paidAmount > 0) {
        paymentStatus = "partial"
      }

      // Update booking
      await supabase
        .from("bookings")
        .update({
          payment_milestones: updatedMilestones,
          payment_status: paymentStatus,
          status: paymentStatus === "paid" ? "completed" : booking.status,
        })
        .eq("id", bookingId)

      // Trigger notification
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payment_received",
            bookingId,
            milestoneId,
          }),
        })
      } catch (notifError) {
        console.error("Failed to send notification:", notifError)
        // Don't fail the webhook if notification fails
      }

      return NextResponse.json({ received: true })
    } catch (error: any) {
      console.error("Error processing webhook:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}

