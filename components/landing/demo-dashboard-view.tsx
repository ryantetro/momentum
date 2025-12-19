"use client"

import { StatsCards } from "@/components/dashboard/stats-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import type { Booking, Client } from "@/types"

interface DemoDashboardViewProps {
  totalClients: number
  totalBookings: number
  pendingPayments: number
  projectedRevenue: number
  bookings: (Booking & { client?: Client })[]
}

interface ActivityEvent {
  id: string
  type: "inquiry" | "contract_sent" | "contract_signed" | "payment" | "reminder"
  description: string
  clientName: string
  timestamp: Date
  color: "green" | "blue" | "orange" | "yellow"
}

function buildActivityTimeline(bookings: Booking[]): ActivityEvent[] {
  const events: ActivityEvent[] = []

  bookings.forEach((booking) => {
    const clientName = booking.client?.name || "Unknown Client"

    if (booking.status === "Inquiry" && booking.created_at) {
      events.push({
        id: `${booking.id}-inquiry`,
        type: "inquiry",
        description: "Inquiry received",
        clientName,
        timestamp: new Date(booking.created_at),
        color: "orange",
      })
    }

    if (
      (booking.status === "PROPOSAL_SENT" || booking.status === "contract_sent") &&
      booking.created_at
    ) {
      const sentDate = booking.updated_at || booking.created_at
      events.push({
        id: `${booking.id}-contract-sent`,
        type: "contract_sent",
        description: "Contract sent",
        clientName,
        timestamp: new Date(sentDate),
        color: "yellow",
      })
    }

    if (booking.contract_signed_at) {
      events.push({
        id: `${booking.id}-contract-signed`,
        type: "contract_signed",
        description: "Contract signed",
        clientName,
        timestamp: new Date(booking.contract_signed_at),
        color: "blue",
      })
    }

    booking.payment_milestones?.forEach((milestone, index) => {
      if (milestone.paid_at) {
        events.push({
          id: `${booking.id}-payment-${index}`,
          type: "payment",
          description: `Payment received: $${milestone.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          clientName,
          timestamp: new Date(milestone.paid_at),
          color: "green",
        })
      }
    })

    if (booking.last_reminder_sent) {
      events.push({
        id: `${booking.id}-reminder`,
        type: "reminder",
        description: "Payment reminder sent",
        clientName,
        timestamp: new Date(booking.last_reminder_sent),
        color: "yellow",
      })
    }
  })

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

function getColorClasses(color: ActivityEvent["color"]) {
  switch (color) {
    case "green":
      return "bg-green-500"
    case "blue":
      return "bg-blue-500"
    case "orange":
      return "bg-orange-500"
    case "yellow":
      return "bg-yellow-500"
    default:
      return "bg-gray-500"
  }
}

export function DemoDashboardView({
  totalClients,
  totalBookings,
  pendingPayments,
  projectedRevenue,
  bookings,
}: DemoDashboardViewProps) {
  const events = buildActivityTimeline(bookings)
  const recentEvents = events.slice(0, 5) // Limit to 5 items for demo

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Overview of your photography business
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalClients={totalClients}
        totalBookings={totalBookings}
        pendingPayments={pendingPayments}
        projectedRevenue={projectedRevenue}
      />

      {/* Recent Activity - Limited */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event, index) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${getColorClasses(event.color)}`}
                    />
                    {index < recentEvents.length - 1 && (
                      <div className="w-px h-full bg-border min-h-[32px] mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-3 min-w-0">
                    <p className="text-sm font-medium">{event.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

