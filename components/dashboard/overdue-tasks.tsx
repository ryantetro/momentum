"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, DollarSign } from "lucide-react"
import Link from "next/link"
import { format, differenceInDays } from "date-fns"
import type { Booking, Client } from "@/types"
import { parseDateSafe } from "@/lib/utils"

export function OverdueTasks() {
  const supabase = createClient()
  const [overdueBookings, setOverdueBookings] = useState<(Booking & { client?: Client })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOverdueBookings() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setLoading(false)
          return
        }

        const { data: photographer } = await supabase
          .from("photographers")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        if (!photographer) {
          setLoading(false)
          return
        }

        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const todayStr = now.toISOString().split("T")[0]

        // Fetch bookings where event_date is in the past, contract is signed, and balance is due
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select(`
            *,
            clients(id, name, email)
          `)
          .eq("photographer_id", photographer.id)
          .lt("event_date", todayStr)
          .or("contract_signed.eq.true,status.eq.Active,status.eq.contract_signed")
          .order("event_date", { ascending: false })

        if (error) {
          console.error("Error fetching overdue bookings:", error)
          setLoading(false)
          return
        }

        if (!bookings) {
          setLoading(false)
          return
        }

        // Filter to only include bookings with balance due
        const overdue = (bookings as any[]).filter((booking: any) => {
          const totalPrice = Number(booking.total_price) || 0
          if (totalPrice === 0) return false

          // Calculate amount paid
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
          return balanceDue > 0
        })

        // Normalize client data (handle array vs object)
        const normalized = overdue.map((booking: any) => {
          const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients
          return {
            ...booking,
            client: client || undefined,
          }
        })

        setOverdueBookings(normalized)
      } catch (error) {
        console.error("Error fetching overdue bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverdueBookings()
  }, [supabase])

  if (loading) {
    return null
  }

  if (overdueBookings.length === 0) {
    return null
  }

  const calculateBalanceDue = (booking: Booking) => {
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

    return totalPrice - paidAmount
  }

  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          Overdue Payments
        </CardTitle>
        <CardDescription>
          Past events with unpaid balances requiring immediate attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {overdueBookings.map((booking) => {
            const balanceDue = calculateBalanceDue(booking)
            const eventDate = parseDateSafe(booking.event_date)!
            const daysPast = differenceInDays(new Date(), eventDate)
            const clientName = booking.client?.name || "Unknown Client"

            return (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="bg-red-600">
                      Overdue
                    </Badge>
                    <span className="font-semibold text-sm truncate">{clientName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {format(eventDate, "MMM d, yyyy")} • {daysPast} {daysPast === 1 ? "day" : "days"} ago
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      ${balanceDue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} due
                    </span>
                  </div>
                </div>
                <Link href={`/bookings/${booking.id}`}>
                  <Button size="sm" variant="default" className="bg-red-600 hover:bg-red-700">
                    <DollarSign className="mr-1 h-3 w-3" />
                    Request Payment
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}



