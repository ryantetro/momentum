"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import type { Booking } from "@/types"

interface RecentActivityProps {
  bookings: Booking[]
}

export function RecentActivity({ bookings }: RecentActivityProps) {
  const recentBookings = bookings.slice(0, 5)

  if (recentBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {booking.client?.name || "Unknown Client"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {booking.service_type} - {format(new Date(booking.event_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">${booking.total_price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground capitalize">{booking.status.replace("_", " ")}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

