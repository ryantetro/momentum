import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/resend"
import { getPaymentReminderEmailTemplate } from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { booking_id, email_body } = body

    if (!booking_id) {
      return NextResponse.json(
        { error: "Missing booking_id" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get booking details with client and photographer info
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, clients(*), photographers(*)")
      .eq("id", booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    const client = booking.clients as any
    const photographer = booking.photographers as any

    // Use client_email from booking if available, otherwise fall back to clients table
    const clientEmail = booking.client_email || client?.email

    if (!clientEmail) {
      return NextResponse.json(
        { error: "No email found for client" },
        { status: 400 }
      )
    }

    // Calculate amount due (deposit or total based on payment status)
    let amountDue = 0
    if (booking.payment_status === "PENDING_DEPOSIT") {
      amountDue = booking.deposit_amount
        ? parseFloat(booking.deposit_amount.toString())
        : parseFloat(booking.total_price.toString()) * 0.2 // Default 20%
    } else {
      // Calculate remaining amount from milestones
      const milestones = booking.payment_milestones || []
      const unpaidMilestones = milestones.filter(
        (m: any) => m.status !== "paid"
      )
      amountDue = unpaidMilestones.reduce(
        (sum: number, m: any) => sum + m.amount,
        0
      )
    }

    const dueDate = booking.payment_due_date
      ? new Date(booking.payment_due_date).toLocaleDateString()
      : "N/A"

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const portalUrl = `${appUrl}/portal/${booking.portal_token}`

    // Use custom email body if provided, otherwise use template
    let emailSubject: string
    let emailHtml: string
    let emailText: string

    if (email_body) {
      // Custom email body provided
      emailSubject = `Payment Reminder: $${amountDue.toFixed(2)} Due Soon`
      emailHtml = email_body
      emailText = email_body.replace(/<[^>]*>/g, "") // Strip HTML tags for text version
    } else {
      // Use template
      const emailTemplate = getPaymentReminderEmailTemplate(
        client?.name || "Valued Client",
        photographer?.business_name || photographer?.name || "Your Photographer",
        booking.id,
        amountDue,
        dueDate,
        portalUrl
      )
      emailSubject = emailTemplate.subject
      emailHtml = emailTemplate.html
      emailText = emailTemplate.text
    }

    // Send email via Resend
    const emailResult = await sendEmail({
      to: clientEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email" },
        { status: 500 }
      )
    }

    // Update last_reminder_sent timestamp
    await supabase
      .from("bookings")
      .update({ last_reminder_sent: new Date().toISOString() })
      .eq("id", booking_id)

    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully",
      booking_id,
      client_email: clientEmail,
    })
  } catch (error: any) {
    console.error("Error sending reminder:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send reminder" },
      { status: 500 }
    )
  }
}


