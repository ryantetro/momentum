"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import type { Booking, Client } from "@/types"

interface ContractViewerProps {
  booking: Booking
  client: Client
}

export function ContractViewer({ booking, client }: ContractViewerProps) {
  if (!booking.contract_text) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No contract available for this booking.</p>
        </CardContent>
      </Card>
    )
  }

  // Replace placeholders in contract text
  const contractText = booking.contract_text
    .replace(/\{\{client_name\}\}/g, client.name)
    .replace(/\{\{event_date\}\}/g, format(new Date(booking.event_date), "MMMM d, yyyy"))
    .replace(/\{\{total_price\}\}/g, `$${booking.total_price.toLocaleString()}`)
    .replace(/\{\{service_type\}\}/g, booking.service_type)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none whitespace-pre-wrap">
          {contractText}
        </div>
        {booking.contract_signed_at && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Signed by <span className="font-medium">{booking.client_signature_name || booking.contract_signed_by}</span> on{" "}
              <span className="font-medium">
                {format(new Date(booking.contract_signed_at), "MMMM d, yyyy 'at' h:mm a")}
              </span>
              {booking.signature_ip_address && booking.signature_ip_address !== "Unknown" && (
                <>
                  {" "}from IP <span className="font-medium font-mono">{booking.signature_ip_address}</span>
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


