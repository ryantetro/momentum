import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email/resend"
import { getInquiryConfirmationEmailTemplate } from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    // Use admin client to bypass RLS for unauthenticated inquiry submissions
    const adminSupabase = createAdminClient()
    const body = await request.json()

    const { photographer_id, name, email, phone, eventDate, eventType, message } = body

    // Validate required fields
    if (!photographer_id || !name || !email || !eventDate || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Get photographer to verify they exist and get their details
    const { data: photographer, error: photographerError } = await supabase
      .from("photographers")
      .select("id, business_name, studio_name, email, website, social_links")
      .eq("id", photographer_id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: "Photographer not found" },
        { status: 404 }
      )
    }

    // Check if client already exists (by email and photographer)
    // Use admin client to bypass RLS for unauthenticated requests
    let clientId: string

    const { data: existingClient } = await adminSupabase
      .from("clients")
      .select("id")
      .eq("photographer_id", photographer_id)
      .eq("email", email.toLowerCase())
      .single()

    if (existingClient) {
      // Use existing client, but update name/phone if provided
      clientId = existingClient.id
      if (name || phone) {
        await adminSupabase
          .from("clients")
          .update({
            name: name || undefined,
            phone: phone || undefined,
          })
          .eq("id", clientId)
      }
    } else {
      // Create new client using admin client to bypass RLS
      const { data: newClient, error: clientError } = await adminSupabase
        .from("clients")
        .insert({
          photographer_id,
          name,
          email: email.toLowerCase(),
          phone: phone || null,
        })
        .select("id")
        .single()

      if (clientError || !newClient) {
        console.error("Error creating client:", clientError)
        return NextResponse.json(
          { 
            error: "Failed to create client",
            details: clientError?.message || "Unknown error",
            code: clientError?.code
          },
          { status: 500 }
        )
      }

      clientId = newClient.id
    }

    // Generate portal token for the booking
    const portalToken = crypto.randomUUID()

    // Create booking with status "Inquiry"
    // Use admin client to bypass RLS for unauthenticated requests
    const { data: booking, error: bookingError } = await adminSupabase
      .from("bookings")
      .insert({
        photographer_id,
        client_id: clientId,
        service_type: eventType,
        event_date: eventDate,
        inquiry_message: message || null,
        status: "Inquiry",
        payment_status: "pending",
        total_price: 0, // Will be set when converted to booking
        portal_token: portalToken,
      })
      .select("id")
      .single()

    if (bookingError || !booking) {
      console.error("Error creating booking:", bookingError)
      return NextResponse.json(
        { 
          error: "Failed to create inquiry",
          details: bookingError?.message || "Unknown error",
          code: bookingError?.code
        },
        { status: 500 }
      )
    }

    // Send confirmation email to client
    try {
      const photographerName = photographer.business_name || photographer.studio_name || photographer.email || "Photographer"
      const photographerStudio = photographer.studio_name || photographer.business_name || null
      
      // Get portfolio/Instagram link from social_links or website
      const socialLinks = photographer.social_links as Record<string, string> | null
      const portfolioLink = photographer.website || socialLinks?.instagram || socialLinks?.facebook || null

      const emailTemplate = getInquiryConfirmationEmailTemplate(
        name,
        photographerName,
        photographerStudio,
        eventType,
        eventDate,
        portfolioLink,
        socialLinks?.instagram || null
      )

      const emailResult = await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        replyTo: photographer.email, // Set reply-to to photographer's email
      })

      if (!emailResult.success) {
        console.error("Failed to send confirmation email:", emailResult.error)
        // Don't fail the request if email fails, just log it
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
    })
  } catch (error: any) {
    console.error("Error in inquiry submission:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to submit inquiry. Please try again.",
      },
      { status: 500 }
    )
  }
}

