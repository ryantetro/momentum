import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bookingId = searchParams.get("bookingId")
    const portalToken = searchParams.get("portalToken")

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Verify booking exists and get portal token if provided
    if (portalToken) {
      const { data: booking } = await adminClient
        .from("bookings")
        .select("id, portal_token")
        .eq("id", bookingId)
        .eq("portal_token", portalToken)
        .single()

      if (!booking) {
        return NextResponse.json(
          { error: "Invalid booking or portal token" },
          { status: 404 }
        )
      }
    }

    // Fetch files for booking (using admin client to bypass RLS)
    const { data: files, error } = await adminClient
      .from("booking_files")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching files:", error)
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      )
    }

    return NextResponse.json({ files: files || [] })
  } catch (error: any) {
    console.error("Error in files API:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch files" },
      { status: 500 }
    )
  }
}

