"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, MessageSquare, DollarSign, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { formatDistanceToNow } from "date-fns"
import type { Booking, Client } from "@/types"

interface ActionRequiredProps {
  inquiries: (Booking & { client?: Client })[]
  overdueBookings: (Booking & { client?: Client })[]
}

export function ActionRequired({ inquiries, overdueBookings }: ActionRequiredProps) {
  const allActions = [
    ...inquiries.map((booking) => ({
      type: "inquiry" as const,
      booking,
      priority: 1, // Highest priority
    })),
    ...overdueBookings.map((booking) => ({
      type: "overdue" as const,
      booking,
      priority: 2,
    })),
  ]

  // Sort by priority, then by date (most recent first)
  allActions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    const aDate = new Date(a.booking.created_at)
    const bDate = new Date(b.booking.created_at)
    return bDate.getTime() - aDate.getTime()
  })

  const displayActions = allActions.slice(0, 5)

  if (displayActions.length === 0) {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Needs Your Attention
          </CardTitle>
          {(inquiries.length > 0 || overdueBookings.length > 0) && (
            <Link href="/bookings">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActions.map((action) => {
            const booking = action.booking
            const clientName = booking.client?.name || "Unknown Client"

            if (action.type === "inquiry") {
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-orange-200"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      <MessageSquare className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">New Inquiry</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {clientName} • {booking.service_type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Link href={`/bookings/${booking.id}`}>
                    <Button size="sm" variant="outline" className="ml-2">
                      View
                    </Button>
                  </Link>
                </div>
              )
            } else {
              // Overdue payment
              const paidAmount =
                booking.payment_milestones
                  ?.filter((m) => m.status === "paid")
                  .reduce((sum, m) => sum + m.amount, 0) || 0
              const amountDue = booking.total_price - paidAmount

              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 border border-red-200"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      <DollarSign className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">Payment Overdue</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {clientName} • ${amountDue.toLocaleString()}
                      </p>
                      {booking.payment_due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due {format(new Date(booking.payment_due_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href={`/bookings/${booking.id}`}>
                    <Button size="sm" variant="outline" className="ml-2">
                      View
                    </Button>
                  </Link>
                </div>
              )
            }
          })}
        </div>
      </CardContent>
    </Card>
  )
}

