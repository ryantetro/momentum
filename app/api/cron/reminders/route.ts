import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email/resend"
import { getFinalBalanceReminderEmailTemplate } from "@/lib/email/templates"

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

    const supabase = await createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const results = {
      upcomingReminders: [] as any[],
      postEventReminders: [] as any[]
    }

    // --- 1. UPCOMING PAYMENT REMINDERS (3 days before due date) ---
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)
    threeDaysFromNow.setHours(0, 0, 0, 0)

    const nextDay = new Date(threeDaysFromNow)
    nextDay.setDate(threeDaysFromNow.getDate() + 1)

    const threeDaysFromNowStr = threeDaysFromNow.toISOString().split("T")[0]
    const nextDayStr = nextDay.toISOString().split("T")[0]

    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const oneDayAgoStr = oneDayAgo.toISOString()

    const { data: upcomingBookings, error: upcomingError } = await supabase
      .from("bookings")
      .select("id, portal_token, client_email, payment_due_date, payment_status")
      .in("payment_status", ["pending", "PENDING_DEPOSIT"])
      .gte("payment_due_date", threeDaysFromNowStr)
      .lt("payment_due_date", nextDayStr)
      .or(`last_reminder_sent.is.null,last_reminder_sent.lt.${oneDayAgoStr}`)

    if (upcomingError) {
      console.error("Error fetching upcoming bookings:", upcomingError)
    } else if (upcomingBookings && upcomingBookings.length > 0) {
      for (const booking of upcomingBookings) {
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
          results.upcomingReminders.push({
            bookingId: booking.id,
            status: result.success ? "sent" : "failed",
            error: result.error,
          })
        } catch (error: any) {
          results.upcomingReminders.push({
            bookingId: booking.id,
            status: "error",
            error: error.message,
          })
        }
      }
    }

    // --- 2. POST-EVENT BALANCE REMINDERS (1 day after event) ---
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const yesterdayStr = yesterday.toISOString().split("T")[0]
    const todayStr = today.toISOString().split("T")[0]

    const { data: postEventBookings, error: postEventError } = await supabase
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

    if (postEventError) {
      console.error("Error fetching post-event bookings:", postEventError)
    } else if (postEventBookings && postEventBookings.length > 0) {
      for (const booking of postEventBookings) {
        try {
          const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients
          const photographer = Array.isArray(booking.photographers)
            ? booking.photographers[0]
            : booking.photographers

          if (!photographer?.auto_reminders_enabled) {
            results.postEventReminders.push({
              bookingId: booking.id,
              status: "skipped",
              reason: "Auto-reminders not enabled",
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

          if (balanceDue <= 0) {
            results.postEventReminders.push({
              bookingId: booking.id,
              status: "skipped",
              reason: "Fully paid",
            })
            continue
          }

          const clientEmail = booking.client_email || client?.email
          if (!clientEmail) {
            results.postEventReminders.push({
              bookingId: booking.id,
              status: "failed",
              error: "No client email",
            })
            continue
          }

          const portalUrl = `${appUrl}/portal/${booking.portal_token}?payment=true`
          const studioName = photographer.business_name || photographer.studio_name || photographer.email

          const emailTemplate = getFinalBalanceReminderEmailTemplate(
            client?.name || "Client",
            studioName,
            booking.service_type,
            balanceDue,
            portalUrl,
            photographer.logo_url
          )

          await sendEmail({
            to: clientEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          })

          const now = new Date().toISOString()
          await supabase
            .from("bookings")
            .update({
              reminder_sent_at: now,
              last_reminder_sent_at: now,
              reminder_count: (booking.reminder_count || 0) + 1,
            })
            .eq("id", booking.id)

          results.postEventReminders.push({
            bookingId: booking.id,
            status: "sent",
            balanceDue,
          })
        } catch (error: any) {
          console.error(`Error processing post-event booking ${booking.id}:`, error)
          results.postEventReminders.push({
            bookingId: booking.id,
            status: "error",
            error: error.message,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error("Error in consolidated cron:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process reminders" },
      { status: 500 }
    )
  }
}




