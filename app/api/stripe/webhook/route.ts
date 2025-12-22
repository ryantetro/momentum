import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe/client"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email/resend"
import { getPaymentSuccessEmailTemplate, getPaymentReceivedEmailTemplate } from "@/lib/email/templates"

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

  // Handle account.updated for Stripe Connect account status changes
  if (event.type === "account.updated") {
    const account = event.data.object as any

    try {
      const supabase = await createClient()

      // Find photographer by stripe_account_id
      const { data: photographer, error: photographerError } = await supabase
        .from("photographers")
        .select("id, user_id")
        .eq("stripe_account_id", account.id)
        .single()

      if (photographerError || !photographer) {
        console.log("Photographer not found for Stripe account:", account.id)
        // Not an error - account might not be linked yet
        return NextResponse.json({ received: true })
      }

      // Log account status changes for debugging
      console.log("Stripe account updated:", {
        account_id: account.id,
        photographer_id: photographer.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        past_due_count: account.requirements?.past_due?.length || 0,
        currently_due_count: account.requirements?.currently_due?.length || 0,
      })

      // Note: We don't need to update the database here since the dashboard
      // fetches requirements in real-time. However, we could store a timestamp
      // of the last update if needed for caching purposes.

      return NextResponse.json({ received: true })
    } catch (error: any) {
      console.error("Error processing account.updated webhook:", error)
      // Don't fail the webhook - return success so Stripe doesn't retry
      return NextResponse.json({ received: true })
    }
  }

  // Handle checkout.session.completed for all payment types
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const bookingId = session.metadata?.bookingId
    const type = session.metadata?.type
    const milestoneId = session.metadata?.milestoneId

    if (!bookingId) {
      console.error("Missing bookingId in checkout session metadata")
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 })
    }

    try {
      // Use admin client to bypass RLS for unauthenticated webhook requests
      const supabase = createAdminClient()

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

      // Update milestones status first
      let milestones = booking.payment_milestones
      if (typeof milestones === "string") {
        try {
          milestones = JSON.parse(milestones)
        } catch (e) {
          milestones = []
        }
      }

      if (!milestones) milestones = []

      // Update the specific milestone status if applicable
      console.log("🔍 Webhook: Updating milestones", {
        type,
        milestoneId,
        milestonesCount: milestones.length,
        milestoneIds: milestones.map((m: any) => ({ id: m.id, name: m.name }))
      })

      const updatedMilestones = milestones.map((m: any) => {
        // For deposit payments, update the Deposit milestone
        if (type === "deposit" && m.name === "Deposit") {
          console.log("✅ Marking Deposit milestone as paid")
          return {
            ...m,
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_checkout_session_id: session.id
          }
        }
        // For milestone payments, update by ID
        if (type === "milestone" && m.id === milestoneId) {
          console.log(`✅ Marking milestone ${m.name} (${m.id}) as paid`)
          return {
            ...m,
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_checkout_session_id: session.id
          }
        }
        return m
      })

      // Calculate current total paid based on updated milestones
      let currentTotalPaid = 0

      // Add deposit amount if it wasn't part of milestones (legacy check)
      // But now we try to track it in milestones too. 
      // Safe fallback: if we updated a Deposit milestone or type is deposit, count the deposit amount
      if (type === "deposit" || (booking.payment_status === "DEPOSIT_PAID")) {
        // If we have a milestone named Deposit that is paid, it will be summed below.
        // If not, we manually add booking.deposit_amount
        const hasDepositMilestone = updatedMilestones.some((m: any) => m.name === "Deposit")
        if (!hasDepositMilestone && booking.deposit_amount) {
          currentTotalPaid += Number(booking.deposit_amount)
        }
      }

      if (updatedMilestones && Array.isArray(updatedMilestones)) {
        const milestonePaid = updatedMilestones.reduce(
          (paid: number, milestone: any) => {
            if (milestone.status === "paid" && milestone.amount) {
              return paid + Number(milestone.amount)
            }
            return paid
          },
          0
        )
        currentTotalPaid += milestonePaid
      }

      // Determine payment status based on amount paid vs total
      let paymentStatus = booking.payment_status
      let bookingStatus = booking.status
      const totalPrice = Number(booking.total_price) || 0
      const isFinalPayment = currentTotalPaid >= totalPrice

      if (type === "deposit") {
        // For deposits, mark as DEPOSIT_PAID and set status to Active
        paymentStatus = "DEPOSIT_PAID"
        bookingStatus = "Active"
      } else {
        // For full payments or milestones, check if fully paid
        if (isFinalPayment) {
          paymentStatus = "paid"
          bookingStatus = "completed"
        } else if (currentTotalPaid > 0) {
          paymentStatus = "partial"
        }
      }

      // Update booking payment status AND milestones
      console.log("💾 Updating booking in database", {
        bookingId,
        paymentStatus,
        bookingStatus,
        milestonesUpdated: updatedMilestones.filter((m: any) => m.status === "paid").length
      })

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_milestones: updatedMilestones,
          payment_status: paymentStatus,
          stripe_payment_intent_id: session.payment_intent || booking.stripe_payment_intent_id,
          status: bookingStatus,
        })
        .eq("id", bookingId)

      if (updateError) {
        console.error("❌ Failed to update booking:", updateError)
        throw updateError
      }

      console.log("✅ Booking updated successfully")

      // Send payment confirmation emails
      try {
        // Get photographer and client details
        const { data: photographer } = await supabase
          .from("photographers")
          .select("email, business_name, studio_name, logo_url")
          .eq("id", booking.photographer_id)
          .single()

        const { data: client } = await supabase
          .from("clients")
          .select("name, email")
          .eq("id", booking.client_id)
          .single()

        const clientEmail = booking.client_email || client?.email
        const clientName = client?.name || "Client"
        const studioName = photographer?.business_name || photographer?.studio_name || photographer?.email || "Studio"

        // If this was the final payment, send PaymentSuccess email to client
        if (isFinalPayment && clientEmail) {
          const paymentSuccessTemplate = getPaymentSuccessEmailTemplate(
            clientName,
            amountPaid,
            studioName,
            photographer?.logo_url,
            {} // socialLinks can be added later
          )

          await sendEmail({
            to: clientEmail,
            subject: paymentSuccessTemplate.subject,
            html: paymentSuccessTemplate.html,
            text: paymentSuccessTemplate.text,
          })
        }

        // Send notification to photographer
        if (photographer && photographer.email) {
          if (type === "deposit" && paymentStatus === "DEPOSIT_PAID") {
            // Deposit paid notification
            const { getPaymentConfirmedEmailTemplate } = await import("@/lib/email/templates")
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            const bookingUrl = `${appUrl}/bookings/${bookingId}`

            const emailTemplate = getPaymentConfirmedEmailTemplate(
              studioName,
              clientName,
              baseAmount,
              bookingId,
              booking.service_type,
              booking.event_date,
              bookingUrl
            )

            await sendEmail({
              to: photographer.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text,
            })
          } else if (isFinalPayment) {
            // Final payment notification
            const finalPaymentTemplate = {
              subject: `🎉 Good news! ${clientName} just paid their final balance`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Payment Received!</h2>
                  <p>Great news! ${clientName} just paid their final balance of $${amountPaid.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}.</p>
                  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Client:</strong> ${clientName}</p>
                    <p><strong>Amount:</strong> $${amountPaid.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</p>
                    <p><strong>Service:</strong> ${booking.service_type}</p>
                    <p><strong>Booking ID:</strong> ${bookingId}</p>
                  </div>
                  <p>This booking is now fully paid and marked as completed.</p>
                </div>
              `,
              text: `
Payment Received!

Great news! ${clientName} just paid their final balance of $${amountPaid.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}.

Client: ${clientName}
Amount: $${amountPaid.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
Service: ${booking.service_type}
Booking ID: ${bookingId}

This booking is now fully paid and marked as completed.
              `,
            }

            await sendEmail({
              to: photographer.email,
              subject: finalPaymentTemplate.subject,
              html: finalPaymentTemplate.html,
              text: finalPaymentTemplate.text,
            })
          }
        }
      } catch (emailError) {
        console.error("Failed to send payment confirmation emails:", emailError)
        // Don't fail the webhook if email fails
      }

      // Trigger notification (for other payment types)
      if (type !== "deposit") {
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

  // Handle payment_intent.succeeded (legacy/fallback)
  // Note: When using Checkout Sessions, metadata is on the session, not the payment intent
  // So we gracefully skip if metadata is missing (checkout.session.completed handles it)
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any
    const { bookingId, milestoneId } = paymentIntent.metadata

    if (!bookingId || !milestoneId) {
      console.log("Payment intent succeeded but missing metadata - likely handled by checkout.session.completed")
      return NextResponse.json({ received: true })
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

