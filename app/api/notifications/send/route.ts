import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getContractSignedEmailTemplate,
  getPaymentReceivedEmailTemplate,
} from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, bookingId, milestoneId } = body

    if (!type || !bookingId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, clients(*), photographers(*)")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    const photographer = booking.photographers
    const client = booking.clients

    if (!photographer || !client) {
      return NextResponse.json(
        { error: "Missing booking data" },
        { status: 400 }
      )
    }

    let emailTemplate

    if (type === "contract_signed") {
      emailTemplate = getContractSignedEmailTemplate(
        client.name,
        bookingId,
        booking.service_type,
        new Date(booking.event_date).toLocaleDateString()
      )
    } else if (type === "payment_received") {
      const milestones = booking.payment_milestones || []
      const milestone = milestones.find((m: any) => m.id === milestoneId)

      if (!milestone) {
        return NextResponse.json(
          { error: "Milestone not found" },
          { status: 404 }
        )
      }

      emailTemplate = getPaymentReceivedEmailTemplate(
        client.name,
        bookingId,
        milestone.amount,
        milestone.name
      )
    } else {
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 }
      )
    }

    // Send email using Supabase's email service
    // Note: Supabase doesn't have a built-in email service in the free tier
    // For MVP, we'll use a simple approach - in production, use Resend, SendGrid, etc.
    // For now, we'll just log the email (you can integrate with a real email service later)

    console.log("Email notification:", {
      to: photographer.email,
      subject: emailTemplate.subject,
      body: emailTemplate.text,
    })

    // In production, integrate with an email service here
    // Example with Supabase Edge Function or external service:
    // await sendEmail({
    //   to: photographer.email,
    //   subject: emailTemplate.subject,
    //   html: emailTemplate.html,
    //   text: emailTemplate.text,
    // })

    return NextResponse.json({
      success: true,
      message: "Notification sent (logged for MVP)",
    })
  } catch (error: any) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    )
  }
}



