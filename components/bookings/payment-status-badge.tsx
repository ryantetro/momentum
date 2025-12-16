import { Badge } from "@/components/ui/badge"

interface PaymentStatusBadgeProps {
  paymentStatus: string
}

export function PaymentStatusBadge({ paymentStatus }: PaymentStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", variant: "outline" },
    PENDING_DEPOSIT: { label: "Pending Deposit", variant: "secondary" },
    DEPOSIT_PAID: { label: "Deposit Paid", variant: "default" },
    partial: { label: "Partial", variant: "secondary" },
    paid: { label: "Paid", variant: "default" },
    overdue: { label: "Overdue", variant: "destructive" },
  }

  const config = statusConfig[paymentStatus] || { label: paymentStatus, variant: "outline" }

  return (
    <Badge variant={config.variant}>{config.label}</Badge>
  )
}


