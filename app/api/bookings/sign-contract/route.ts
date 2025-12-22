import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, clientName, addressDetails } = body

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

    // Use admin client to bypass RLS for unauthenticated portal access
    const supabase = createAdminClient()

    // If address details are provided, update the client
    if (addressDetails) {
      // First get the client_id from the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("client_id")
        .eq("id", bookingId)
        .single()

      if (bookingError || !bookingData) {
        console.error("Error fetching booking for client update:", bookingError)
      } else if (bookingData.client_id) {
        const { error: clientUpdateError } = await supabase
          .from("clients")
          .update({
            address: addressDetails.address || null,
            city: addressDetails.city || null,
            state: addressDetails.state || null,
            zip: addressDetails.zip || null,
            country: addressDetails.country || null,
          })
          .eq("id", bookingData.client_id)

        if (clientUpdateError) {
          console.error("Error updating client address:", clientUpdateError)
          // Don't fail the signing process if address update fails, just log it
        } else {
          console.log("Client address updated successfully")
        }
      }
    }

    // Update booking with new schema fields including audit trail
    // Note: We set both contract_signed_by and client_signature_name for backward compatibility
    const { data: updatedBooking, error } = await supabase
      .from("bookings")
      .update({
        contract_signed: true,
        contract_signed_at: new Date().toISOString(),
        client_signature_name: clientName,
        signature_ip_address: ipAddress,
        signature_user_agent: userAgent,
        status: "contract_signed",
      })
      .eq("id", bookingId)
      .select("contract_signed_at, contract_signed, client_signature_name")
      .single()

    if (error) {
      console.error("Error updating booking signature:", error)
      throw error
    }

    // Verify the update succeeded
    if (!updatedBooking || !updatedBooking.contract_signed_at) {
      console.error("Signature update may have failed - contract_signed_at is null")
      throw new Error("Failed to verify signature was saved")
    }

    console.log("Contract signature saved successfully:", {
      bookingId,
      contract_signed_at: updatedBooking.contract_signed_at,
      client_signature_name: updatedBooking.client_signature_name,
    })

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

    return NextResponse.json({
      success: true,
      contract_signed_at: updatedBooking.contract_signed_at,
      client_signature_name: updatedBooking.client_signature_name,
    })
  } catch (error: any) {
    console.error("Error signing contract:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sign contract" },
      { status: 500 }
    )
  }
}

