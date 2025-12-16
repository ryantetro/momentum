import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET to ensure only Vercel can call this
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error("CRON_SECRET is not set in environment variables")
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Calculate exactly 3 days from today (date only, ignore time)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)
    threeDaysFromNow.setHours(0, 0, 0, 0)

    // Calculate next day to create a date range for the exact day
    const nextDay = new Date(threeDaysFromNow)
    nextDay.setDate(threeDaysFromNow.getDate() + 1)

    // Format dates for SQL query (date only, no time)
    const threeDaysFromNowStr = threeDaysFromNow.toISOString().split("T")[0]
    const nextDayStr = nextDay.toISOString().split("T")[0]

    // Calculate 24 hours ago for duplicate prevention
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const oneDayAgoStr = oneDayAgo.toISOString()

    // Find bookings where:
    // - payment_status is 'pending' or 'PENDING_DEPOSIT'
    // - payment_due_date is exactly 3 days from today (date match)
    // - last_reminder_sent is NULL or older than 24 hours (prevent duplicates)
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, portal_token, client_email, payment_due_date, payment_status")
      .in("payment_status", ["pending", "PENDING_DEPOSIT"])
      .gte("payment_due_date", threeDaysFromNowStr)
      .lt("payment_due_date", nextDayStr)
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
        results: [],
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

    const successCount = results.filter((r) => r.status === "sent").length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: true,
      message: `Processed ${bookings.length} bookings: ${successCount} sent, ${failureCount} failed`,
      count: successCount,
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

