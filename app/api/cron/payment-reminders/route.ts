import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  // For MVP, this can be triggered manually or via cron
  // In production, set up Vercel Cron or similar (e.g., 8 AM EST daily)
  try {
    const supabase = await createClient()

    // Get today's date and calculate 3 days from now
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)
    threeDaysFromNow.setHours(23, 59, 59, 999)

    // Format dates for SQL query
    const todayStr = today.toISOString().split("T")[0]
    const threeDaysFromNowStr = threeDaysFromNow.toISOString().split("T")[0]

    // Find bookings where:
    // - payment_status is NOT 'paid' or 'DEPOSIT_PAID'
    // - payment_due_date is in the next 3 days (between today and 3 days from now)
    // - last_reminder_sent is NULL or older than 24 hours (to avoid duplicates)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const oneDayAgoStr = oneDayAgo.toISOString()

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id")
      .neq("payment_status", "paid")
      .neq("payment_status", "DEPOSIT_PAID")
      .gte("payment_due_date", todayStr)
      .lte("payment_due_date", threeDaysFromNowStr)
      .or(`last_reminder_sent.is.null,last_reminder_sent.lt.${oneDayAgoStr}`)

    if (error) {
      console.error("Error fetching bookings:", error)
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      )
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No reminders to send",
        count: 0,
      })
    }

    const results = []
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // For each booking, call the internal /api/send-reminder route
    for (const booking of bookings) {
      try {
        const response = await fetch(`${appUrl}/api/send-reminder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            booking_id: booking.id,
          }),
        })

        const result = await response.json()

        if (result.success) {
          results.push({
            bookingId: booking.id,
            clientEmail: result.client_email,
            status: "sent",
          })
        } else {
          results.push({
            bookingId: booking.id,
            status: "failed",
            error: result.error,
          })
        }
      } catch (error: any) {
        console.error(`Error processing booking ${booking.id}:`, error)
        results.push({
          bookingId: booking.id,
          status: "error",
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${bookings.length} bookings`,
      results,
    })
  } catch (error: any) {
    console.error("Error in payment reminders cron:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process reminders" },
      { status: 500 }
    )
  }
}

