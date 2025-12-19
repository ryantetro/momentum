import { Badge } from "@/components/ui/badge"

interface PaymentStatusBadgeProps {
  paymentStatus: string
  eventDate?: string | null
  totalPrice?: number | null
  depositAmount?: number | null
  paymentMilestones?: any[] | string | null
}

export function PaymentStatusBadge({
  paymentStatus,
  eventDate,
  totalPrice,
  depositAmount,
  paymentMilestones,
}: PaymentStatusBadgeProps) {
  // Calculate balance due if we have the necessary data
  let balanceDue = 0
  let isOverdue = false

  if (eventDate && totalPrice) {
    const eventDateObj = new Date(eventDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDateObj.setHours(0, 0, 0, 0)

    const isPastEvent = eventDateObj < today

    if (isPastEvent) {
      // Calculate amount paid
      let paidAmount = 0

      if (paymentStatus === "DEPOSIT_PAID" && depositAmount) {
        paidAmount += Number(depositAmount)
      }

      let milestones = paymentMilestones
      if (typeof milestones === "string") {
        try {
          milestones = JSON.parse(milestones)
        } catch (e) {
          milestones = []
        }
      }

      if (milestones && Array.isArray(milestones)) {
        const milestonePaid = milestones.reduce(
          (paid: number, milestone: any) => {
            if (milestone.status === "paid" && milestone.amount) {
              return paid + Number(milestone.amount)
            }
            return paid
          },
          0
        )
        paidAmount += milestonePaid
      }

      balanceDue = Number(totalPrice) - paidAmount
      isOverdue = balanceDue > 0
    }
  }

  // Determine status based on overdue check or payment status
  let finalStatus = paymentStatus
  if (isOverdue) {
    finalStatus = "overdue"
  } else if (balanceDue === 0 && totalPrice && totalPrice > 0) {
    finalStatus = "paid"
  }

  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pending: { label: "Payment Pending", variant: "outline" },
    PENDING_DEPOSIT: { label: "Pending Deposit", variant: "secondary" },
    DEPOSIT_PAID: { label: "Deposit Paid", variant: "default" },
    partial: { label: "Partial", variant: "secondary" },
    paid: { label: "Paid", variant: "default" },
    overdue: { label: "Overdue", variant: "destructive" },
  }

  const config = statusConfig[finalStatus] || { label: finalStatus, variant: "outline" }

  return <Badge variant={config.variant}>{config.label}</Badge>
}



