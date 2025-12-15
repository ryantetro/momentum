"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import type { Booking, Client } from "@/types"

interface BookingDetailsProps {
  booking: Booking
  client: Client
}

export function BookingDetails({ booking, client }: BookingDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Client</p>
            <p className="text-lg font-semibold">{client.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Service Type</p>
            <p className="text-lg font-semibold capitalize">{booking.service_type}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Event Date</p>
            <p className="text-lg font-semibold">
              {format(new Date(booking.event_date), "MMMM d, yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
            <p className="text-lg font-semibold">${booking.total_price.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

