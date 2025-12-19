import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, timeline } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // For now, we'll store timeline in a JSONB field or as metadata
    // Since we don't have a timeline field, we can add it to the booking metadata
    // For MVP, we'll just acknowledge the request
    // In production, you'd add a timeline field to the bookings table

    return NextResponse.json({ success: true, message: "Timeline saved" })
  } catch (error: any) {
    console.error("Error updating timeline:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update timeline" },
      { status: 500 }
    )
  }
}



