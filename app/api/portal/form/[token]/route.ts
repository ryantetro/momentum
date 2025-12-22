import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        // Use admin client to bypass RLS since portal users are unauthenticated
        const supabase = createAdminClient()

        console.log("[API] Fetching form for token:", token)

        // 1. Get the booking ID from the token
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("id")
            .eq("portal_token", token)
            .single()

        if (bookingError || !booking) {
            console.error("[API] Invalid portal token:", token, bookingError)
            return NextResponse.json(
                { error: "Invalid portal token" },
                { status: 404 }
            )
        }

        console.log("[API] Found booking:", booking.id)

        // 2. Fetch the form for this booking
        const { data: form, error: formError } = await supabase
            .from("client_forms")
            .select("form_fields, form_data")
            .eq("booking_id", booking.id)
            .single()

        if (formError && formError.code !== "PGRST116") {
            console.error("[API] Error fetching form:", formError)
            return NextResponse.json(
                { error: "Failed to fetch form" },
                { status: 500 }
            )
        }

        // Return null if no form found (valid case)
        if (!form) {
            console.log("[API] No form found for booking:", booking.id)
            return NextResponse.json({ form_fields: [], form_data: {} })
        }

        console.log("[API] Returning form fields count:", (form.form_fields as any[])?.length)
        return NextResponse.json(form)
    } catch (error: any) {
        console.error("Error in form fetch:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
