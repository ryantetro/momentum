import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email/resend"
import { getFinalBalanceReminderEmailTemplate } from "@/lib/email/templates"

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET to ensure only authorized triggers can call this
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

  try {
    const supabase = await createAdminClient()

    // Calculate yesterday's date (24 hours ago)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    // Format dates for SQL query (date only, no time)
    const yesterdayStr = yesterday.toISOString().split("T")[0]
    const todayStr = today.toISOString().split("T")[0]

    // Find bookings where:
    // - event_date was exactly yesterday (24 hours ago)
    // - contract_signed is true OR status is Active
    // - reminder_sent_at is null (to avoid duplicates)
    // - balance_due > 0 (we'll calculate this)
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        clients(id, name, email),
        photographers(id, auto_reminders_enabled, business_name, studio_name, logo_url, email)
      `)
      .gte("event_date", yesterdayStr)
      .lt("event_date", todayStr)
      .or("contract_signed.eq.true,status.eq.Active,status.eq.contract_signed")
      .is("reminder_sent_at", null)

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

    // Process each booking
    for (const booking of bookings) {
      try {
        // Normalize client and photographer data
        const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients
        const photographer = Array.isArray(booking.photographers)
          ? booking.photographers[0]
          : booking.photographers

        // Check if photographer has auto-reminders enabled
        if (!photographer?.auto_reminders_enabled) {
          results.push({
            bookingId: booking.id,
            status: "skipped",
            reason: "Auto-reminders not enabled for photographer",
          })
          continue
        }

        // Calculate balance due
        const totalPrice = Number(booking.total_price) || 0
        let paidAmount = 0

        if (booking.payment_status === "DEPOSIT_PAID" && booking.deposit_amount) {
          paidAmount += Number(booking.deposit_amount)
        }

        let milestones = booking.payment_milestones
        if (typeof milestones === "string") {
          try {
            milestones = JSON.parse(milestones)
          } catch (e) {
            milestones = []
          }
        }

        if (milestones && Array.isArray(milestones)) {
          const milestonePaid = milestones.reduce(
            (paid: number, milestone: any) => {
              if (milestone.status === "paid" && milestone.amount) {
                return paid + Number(milestone.amount)
              }
              return paid
            },
            0
          )
          paidAmount += milestonePaid
        }

        const balanceDue = totalPrice - paidAmount

        // Skip if fully paid
        if (balanceDue <= 0) {
          results.push({
            bookingId: booking.id,
            status: "skipped",
            reason: "Booking is fully paid",
          })
          continue
        }

        // Get client email
        const clientEmail = booking.client_email || client?.email
        if (!clientEmail) {
          results.push({
            bookingId: booking.id,
            status: "failed",
            error: "No client email found",
          })
          continue
        }

        // Generate portal URL
        const portalUrl = `${appUrl}/portal/${booking.portal_token}?payment=true`

        // Get photographer branding
        const studioName = photographer.business_name || photographer.studio_name || photographer.email
        const logoUrl = photographer.logo_url

        // Generate email template
        const emailTemplate = getFinalBalanceReminderEmailTemplate(
          client?.name || "Client",
          studioName,
          booking.service_type,
          balanceDue,
          portalUrl,
          logoUrl
        )

        // Send email
        await sendEmail({
          to: clientEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        })

        // Update booking with reminder tracking
        const now = new Date().toISOString()
        await supabase
          .from("bookings")
          .update({
            reminder_sent_at: now,
            last_reminder_sent_at: now,
            reminder_count: (booking.reminder_count || 0) + 1,
          })
          .eq("id", booking.id)

        results.push({
          bookingId: booking.id,
          clientEmail,
          status: "sent",
          balanceDue,
        })
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

