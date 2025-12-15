import { Badge } from "@/components/ui/badge"

interface BookingStatusBadgeProps {
  status: string
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Draft", variant: "outline" },
    contract_sent: { label: "Contract Sent", variant: "secondary" },
    PROPOSAL_SENT: { label: "Proposal Sent", variant: "secondary" },
    contract_signed: { label: "Contract Signed", variant: "default" },
    payment_pending: { label: "Payment Pending", variant: "secondary" },
    completed: { label: "Completed", variant: "default" },
  }

  const config = statusConfig[status] || { label: status.replace("_", " "), variant: "outline" }

  return (
    <Badge variant={config.variant}>{config.label}</Badge>
  )
}

