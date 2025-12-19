import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/resend"
import { getProposalEmailTemplate } from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 })
    }

    // Get photographer
    const { data: photographer } = await supabase
      .from("photographers")
      .select("id, business_name, studio_name, email, website, social_links")
      .eq("user_id", session.user.id)
      .single()

    if (!photographer) {
      return NextResponse.json({ error: "Photographer not found" }, { status: 404 })
    }

    // Get booking with client
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, clients(*)")
      .eq("id", bookingId)
      .eq("photographer_id", photographer.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Ensure booking has contract_text and portal_token
    if (!booking.contract_text) {
      return NextResponse.json(
        { error: "Booking does not have a contract. Please generate a proposal first." },
        { status: 400 }
      )
    }

    if (!booking.portal_token) {
      return NextResponse.json(
        { error: "Booking does not have a portal token" },
        { status: 400 }
      )
    }

    // Get client
    const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Generate portal URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const portalUrl = `${baseUrl}/portal/${booking.portal_token}`

    // Get photographer name
    const photographerName =
      photographer.business_name || photographer.studio_name || photographer.email || "Photographer"
    const photographerStudio = photographer.studio_name || photographer.business_name || null

    // Calculate deposit amount
    const depositAmount = booking.deposit_amount || booking.total_price * 0.2

    // Generate email template
    const emailTemplate = getProposalEmailTemplate(
      client.name,
      photographerName,
      photographerStudio,
      booking.service_type,
      booking.event_date,
      portalUrl,
      booking.total_price,
      depositAmount
    )

    // Send email
    const emailResult = await sendEmail({
      to: client.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
      replyTo: photographer.email,
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Proposal email sent successfully",
    })
  } catch (error: any) {
    console.error("Error sending proposal email:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send proposal email" },
      { status: 500 }
    )
  }
}

