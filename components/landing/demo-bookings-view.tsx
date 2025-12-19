"use client"

import { BookingCard } from "@/components/bookings/booking-card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Booking, Client } from "@/types"

interface DemoBookingsViewProps {
  bookings: (Booking & { client?: Client })[]
}

export function DemoBookingsView({ bookings }: DemoBookingsViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Bookings</h2>
        <p className="text-sm text-muted-foreground">All your photography bookings</p>
      </div>

      {/* Bookings Grid */}
      <TooltipProvider>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.slice(0, 6).map((booking) => (
            <Tooltip key={booking.id}>
              <TooltipTrigger asChild>
                <div>
                  <BookingCard booking={booking} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Automated payment reminders included</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  )
}

