"use client"

import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Link2 } from "lucide-react"
import { useToast } from "@/components/ui/toaster"
import type { Booking, Client } from "@/types"
import { cn, formatDateSafe } from "@/lib/utils"

interface BookingCardProps {
  booking: Booking & { client?: Client }
}

export function BookingCard({ booking }: BookingCardProps) {
  const { toast } = useToast()

  // Calculate payment progress
  const calculateProgress = () => {
    const status = (booking.payment_status || "").toLowerCase()
    const milestones = booking.payment_milestones || []

    const milestonesPaid = milestones.reduce(
      (sum: number, m: any) => (m.status === "paid" ? sum + m.amount : sum),
      0
    ) || 0

    const hasPaidDepositMilestone = milestones.some(
      (m: any) => m.name === "Deposit" && m.status === "paid"
    )

    const depositPaid = !hasPaidDepositMilestone && (status === "deposit_paid" || status === "paid" || status === "partial")
      ? (booking.deposit_amount || 0)
      : 0

    let totalPaid = depositPaid + milestonesPaid

    // If payment status is explicitly 'paid', ensure we show full amount
    if (status === "paid" && totalPaid < booking.total_price) {
      totalPaid = booking.total_price
    }

    const percentage = booking.total_price > 0 ? (totalPaid / booking.total_price) * 100 : 0

    return { totalPaid, percentage: Math.min(percentage, 100) }
  }

  const { totalPaid, percentage } = calculateProgress()

  // Status badge configuration
  const getStatusConfig = () => {
    const statusMap: Record<
      string,
      { label: string; className: string }
    > = {
      Inquiry: { label: "New Inquiry", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
      PROPOSAL_SENT: { label: "Proposal Sent", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      contract_sent: { label: "Proposal Sent", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      contract_signed: { label: "Contract Signed", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      payment_pending: { label: "Payment Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      completed: { label: "Completed", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
    }

    return statusMap[booking.status] || { label: booking.status, className: "bg-gray-100 text-gray-800" }
  }

  const statusConfig = getStatusConfig()

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const portalUrl = `${window.location.origin}/portal/${booking.portal_token}`
    navigator.clipboard.writeText(portalUrl)
    toast({
      title: "Link copied",
      description: "Proposal link copied to clipboard",
    })
  }

  return (
    <Link href={`/bookings/${booking.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with Status and Quick Action */}
            <div className="flex items-start justify-between">
              <Badge className={cn("text-sm font-semibold px-3 py-1", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 w-8 p-0"
                title="Copy proposal link"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Client Name and Event Date */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {(() => {
                  // Handle both array and object formats from Supabase
                  // Supabase can return clients as an array or object depending on query
                  const client = Array.isArray((booking as any).clients)
                    ? (booking as any).clients[0]
                    : Array.isArray(booking.client)
                      ? booking.client[0]
                      : booking.client || (booking as any).clients
                  return client?.name || "Unknown Client"
                })()}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDateSafe(booking.event_date)}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {booking.service_type}
              </p>
              {/* Show inquiry message preview for inquiries */}
              {booking.status === "Inquiry" && booking.inquiry_message && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                  "{booking.inquiry_message}"
                </p>
              )}
            </div>

            {/* Financial Progress Bar - only show for non-inquiries */}
            {booking.status !== "Inquiry" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment Progress</span>
                  <span className="font-medium">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    ${totalPaid.toLocaleString()} / ${booking.total_price.toLocaleString()}
                  </span>
                  {booking.deposit_amount && totalPaid >= booking.deposit_amount && (
                    <span className="text-green-600 dark:text-green-400">Deposit Paid</span>
                  )}
                </div>
              </div>
            )}

            {/* Inquiry-specific message */}
            {booking.status === "Inquiry" && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Click to review and convert to booking
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

