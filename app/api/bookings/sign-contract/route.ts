import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, clientName } = body

    if (!bookingId || !clientName) {
      return NextResponse.json(
        { error: "Missing bookingId or clientName" },
        { status: 400 }
      )
    }

    // Extract IP address from request headers
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "Unknown"

    // Extract User Agent from request headers
    const userAgent = request.headers.get("user-agent") || "Unknown"

    const supabase = await createClient()

    // Update booking with new schema fields including audit trail
    const { error } = await supabase
      .from("bookings")
      .update({
        contract_signed: true,
        contract_signed_at: new Date().toISOString(),
        contract_signed_by: clientName,
        client_signature_name: clientName,
        signature_ip_address: ipAddress,
        signature_user_agent: userAgent,
        status: "contract_signed",
      })
      .eq("id", bookingId)

    if (error) {
      throw error
    }

    // Trigger notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contract_signed",
          bookingId,
        }),
      })
    } catch (notifError) {
      console.error("Failed to send notification:", notifError)
      // Don't fail if notification fails
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error signing contract:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sign contract" },
      { status: 500 }
    )
  }
}

