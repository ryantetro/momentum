import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, portalToken, formData } = body

    if (!bookingId || !portalToken || !formData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for unauthenticated portal access
    const supabase = createAdminClient()

    // Verify booking exists and matches portal token
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", bookingId)
      .eq("portal_token", portalToken)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Invalid booking or portal token" },
        { status: 404 }
      )
    }

    // Check if form exists
    const { data: existing } = await supabase
      .from("client_forms")
      .select("id")
      .eq("booking_id", bookingId)
      .single()

    if (existing) {
      // Update existing form data
      const { error } = await supabase
        .from("client_forms")
        .update({
          form_data: formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) throw error
    } else {
      // Create new form with data
      const { error } = await supabase.from("client_forms").insert({
        booking_id: bookingId,
        form_data: formData,
      })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error saving form data:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save form data" },
      { status: 500 }
    )
  }
}

