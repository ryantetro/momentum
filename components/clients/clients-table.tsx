"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"
import type { Client, Booking } from "@/types"
import { ClientStatusBadge } from "./client-status-badge"

interface ClientWithBookings extends Client {
  bookings?: Booking[]
}

interface ClientsTableProps {
  clients: ClientWithBookings[]
  onClientClick?: (client: ClientWithBookings) => void
}

function getClientStatus(bookings: Booking[] = []): "Inquiry" | "Active" | "Past" {
  const hasInquiry = bookings.some((b) => b.status === "Inquiry")
  const hasActive = bookings.some(
    (b) => b.status !== "completed" && b.status !== "Inquiry"
  )

  if (hasInquiry) return "Inquiry"
  if (hasActive) return "Active"
  return "Past"
}

function getLastActivity(bookings: Booking[] = []): string | null {
  const dates: Date[] = []

  bookings.forEach((booking) => {
    if (booking.created_at) dates.push(new Date(booking.created_at))
    if (booking.contract_signed_at) dates.push(new Date(booking.contract_signed_at))
    if (booking.payment_milestones) {
      booking.payment_milestones.forEach((milestone) => {
        if (milestone.paid_at) dates.push(new Date(milestone.paid_at))
      })
    }
  })

  if (dates.length === 0) return null

  const mostRecent = new Date(Math.max(...dates.map((d) => d.getTime())))
  return formatDistanceToNow(mostRecent, { addSuffix: true })
}

function getTotalValue(bookings: Booking[] = []): number {
  return bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)
}

export function ClientsTable({ clients, onClientClick }: ClientsTableProps) {
  if (clients.length === 0) {
    return null // Empty state is handled by parent
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const status = getClientStatus(client.bookings)
            const lastActivity = getLastActivity(client.bookings)
            const totalValue = getTotalValue(client.bookings)

            return (
              <TableRow
                key={client.id}
                className={onClientClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onClientClick?.(client)}
              >
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>
                  <ClientStatusBadge status={status} />
                </TableCell>
                <TableCell>
                  {lastActivity ? (
                    <span className="text-sm text-muted-foreground">{lastActivity}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {totalValue > 0 ? (
                    <span className="font-medium">
                      ${totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}



