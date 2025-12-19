"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import type { Booking, Client } from "@/types"
import { cn } from "@/lib/utils"

interface ActivityEvent {
  id: string
  type: "inquiry" | "contract_sent" | "contract_signed" | "payment" | "reminder"
  description: string
  clientName: string
  timestamp: Date
  bookingId?: string
  color: "green" | "blue" | "orange" | "yellow"
}

function buildActivityTimeline(bookings: Booking[]): ActivityEvent[] {
  const events: ActivityEvent[] = []

  // Helper function to format service type
  const formatServiceType = (serviceType: string) => {
    if (!serviceType) return ""
    return serviceType.charAt(0).toUpperCase() + serviceType.slice(1)
  }

  // Helper function to get client first name or full name
  const getClientDisplayName = (clientName: string) => {
    if (!clientName || clientName === "Unknown Client") return "Unknown Client"
    const parts = clientName.trim().split(/\s+/)
    if (parts.length > 1) {
      // Return first name + last initial
      return `${parts[0]} ${parts[parts.length - 1][0]}.`
    }
    return parts[0]
  }

  bookings.forEach((booking) => {
    // Handle both array and object formats from Supabase
    const client = Array.isArray((booking as any).clients)
      ? (booking as any).clients[0]
      : Array.isArray(booking.client)
      ? booking.client[0]
      : booking.client || (booking as any).clients
    
    const clientName = client?.name || "Unknown Client"
    const clientDisplayName = getClientDisplayName(clientName)
    const serviceType = formatServiceType(booking.service_type)

    // Inquiry received
    if (booking.status === "Inquiry" && booking.created_at) {
      events.push({
        id: `${booking.id}-inquiry`,
        type: "inquiry",
        description: `New inquiry from ${clientDisplayName}`,
        clientName,
        timestamp: new Date(booking.created_at),
        bookingId: booking.id,
        color: "orange",
      })
    }

    // Booking created (converted from inquiry or new booking)
    // Show this if booking was created but is not an inquiry and was created recently
    if (
      booking.status !== "Inquiry" &&
      booking.status !== "draft" &&
      booking.created_at
    ) {
      const createdDate = new Date(booking.created_at)
      const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      
      // Only show if created within last 7 days (to avoid showing old bookings)
      if (daysSinceCreation <= 7) {
        const eventDescription = serviceType
          ? `New ${serviceType} booking created for ${clientDisplayName}`
          : `New booking created for ${clientDisplayName}`
        
        events.push({
          id: `${booking.id}-booking-created`,
          type: "booking_created",
          description: eventDescription,
          clientName,
          timestamp: createdDate,
          bookingId: booking.id,
          color: "blue",
        })
      }
    }

    // Contract sent (PROPOSAL_SENT or contract_sent)
    if (
      (booking.status === "PROPOSAL_SENT" || booking.status === "contract_sent") &&
      booking.created_at
    ) {
      // Use updated_at if available, otherwise created_at
      const sentDate = booking.updated_at || booking.created_at
      const eventDescription = serviceType 
        ? `Contract sent to ${clientDisplayName} for ${serviceType} Session`
        : `Contract sent to ${clientDisplayName}`
      
      events.push({
        id: `${booking.id}-contract-sent`,
        type: "contract_sent",
        description: eventDescription,
        clientName,
        timestamp: new Date(sentDate),
        bookingId: booking.id,
        color: "yellow",
      })
    }

    // Contract signed
    if (booking.contract_signed_at) {
      // Try to get event name from inquiry_message or use service type
      let eventName = serviceType
      if (booking.inquiry_message) {
        // Try to extract event name from inquiry message (first line or first sentence)
        const firstLine = booking.inquiry_message.split('\n')[0].trim()
        if (firstLine.length > 0 && firstLine.length < 50) {
          eventName = firstLine
        }
      }
      
      const eventDescription = eventName && serviceType
        ? `Contract signed for ${eventName}`
        : serviceType
        ? `Contract signed for ${serviceType} Session`
        : `Contract signed by ${clientDisplayName}`
      
      events.push({
        id: `${booking.id}-contract-signed`,
        type: "contract_signed",
        description: eventDescription,
        clientName,
        timestamp: new Date(booking.contract_signed_at),
        bookingId: booking.id,
        color: "blue",
      })
    }

    // Payments
    booking.payment_milestones?.forEach((milestone, index) => {
      if (milestone.paid_at) {
        events.push({
          id: `${booking.id}-payment-${index}`,
          type: "payment",
          description: `Payment received: $${milestone.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} from ${clientDisplayName}`,
          clientName,
          timestamp: new Date(milestone.paid_at),
          bookingId: booking.id,
          color: "green",
        })
      }
    })

    // Reminder sent
    if (booking.last_reminder_sent) {
      events.push({
        id: `${booking.id}-reminder`,
        type: "reminder",
        description: `Payment reminder sent automatically to ${clientDisplayName}`,
        clientName,
        timestamp: new Date(booking.last_reminder_sent),
        bookingId: booking.id,
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

interface RecentActivityProps {
  bookings: (Booking & { client?: Client })[]
}

export function RecentActivity({ bookings }: RecentActivityProps) {
  const events = buildActivityTimeline(bookings)
  const recentEvents = events.slice(0, 15)

  if (recentEvents.length === 0) {
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
          {recentEvents.map((event, index) => (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    getColorClasses(event.color)
                  )}
                />
                {index < recentEvents.length - 1 && (
                  <div className="w-px h-full bg-border min-h-[40px] mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  {event.bookingId && (
                    <Link
                      href={`/bookings/${event.bookingId}`}
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 flex-shrink-0"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}



