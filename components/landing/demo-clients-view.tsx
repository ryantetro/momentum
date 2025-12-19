"use client"

import { ClientsTable } from "@/components/clients/clients-table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { mockBookings } from "@/lib/mock-data"
import type { Client, Booking } from "@/types"

interface DemoClientsViewProps {
  clients: Client[]
}

export function DemoClientsView({ clients }: DemoClientsViewProps) {
  // Add bookings to clients for the table
  const clientsWithBookings = clients.map((client) => ({
    ...client,
    bookings: mockBookings.filter((b) => b.client_id === client.id) as Booking[],
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Clients</h2>
        <p className="text-sm text-muted-foreground">Manage your client database</p>
      </div>

      {/* Clients Table */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ClientsTable clients={clientsWithBookings} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>All client info in one place</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

