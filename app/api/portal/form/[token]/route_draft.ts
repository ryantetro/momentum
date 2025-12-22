
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params
        const supabase = await createClient()

        // 1. Get the booking ID from the token (allow public access since token is the key)
        const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select("id")
            .eq("portal_token", token)
            .single()

        if (bookingError || !booking) {
            return NextResponse.json(
                { error: "Invalid portal token" },
                { status: 404 }
            )
        }

        // 2. Fetch the form for this booking
        // Note: We need to use admin/service role if RLS blocks public read, 
        // BUT we are in a server component with createClient(). 
        // Standard createClient() uses cookies. 
        // If we are unauthenticated, standard RLS blocks us.
        // So we should use createAdminClient (which bypasses RLS).

        // Changing approach: Use admin client
        return NextResponse.json({ error: "Use POST or check implementation" }, { status: 405 })

    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
