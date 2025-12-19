import type { PaymentMilestone } from "@/types"

/**
 * Calculate deposit amount from total price and deposit percentage
 */
export function calculateDepositAmount(
  totalPrice: number,
  depositPercentage: number
): number {
  return Math.round(totalPrice * depositPercentage * 100) / 100
}

/**
 * Generate standard payment milestones (Deposit + Final Payment)
 * @param totalPrice - Total booking price
 * @param depositAmount - Deposit amount (already calculated)
 * @param eventDate - Event date string (ISO format)
 * @returns Array of 2 milestones: Deposit (due immediately) and Final Payment (due 30 days before event)
 */
export function generateStandardMilestones(
  totalPrice: number,
  depositAmount: number,
  eventDate: string
): PaymentMilestone[] {
  const finalAmount = totalPrice - depositAmount

  // Calculate final payment due date (30 days before event)
  const eventDateObj = new Date(eventDate)
  const finalDueDate = new Date(eventDateObj)
  finalDueDate.setDate(finalDueDate.getDate() - 30)

  const depositMilestone: PaymentMilestone = {
    id: Math.random().toString(36).substring(7),
    name: "Deposit",
    amount: depositAmount,
    percentage: null,
    due_date: new Date().toISOString().split("T")[0], // Due immediately (today)
    status: "pending",
    paid_at: null,
    stripe_payment_intent_id: null,
  }

  const finalMilestone: PaymentMilestone = {
    id: Math.random().toString(36).substring(7),
    name: "Final Payment",
    amount: finalAmount,
    percentage: null,
    due_date: finalDueDate.toISOString().split("T")[0],
    status: "pending",
    paid_at: null,
    stripe_payment_intent_id: null,
  }

  return [depositMilestone, finalMilestone]
}

