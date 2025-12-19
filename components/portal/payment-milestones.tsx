"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { loadStripe } from "@stripe/stripe-js"
import type { PaymentMilestone, Booking } from "@/types"
import { useToast } from "@/components/ui/toaster"

interface PaymentMilestonesProps {
  booking: Booking
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function PaymentMilestones({ booking }: PaymentMilestonesProps) {
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()
  const milestones = booking.payment_milestones || []

  const handlePayment = async (milestone: PaymentMilestone) => {
    if (milestone.status === "paid") {
      return
    }

    setProcessing(milestone.id)

    try {
      // Create payment intent
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          milestoneId: milestone.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment")
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
      setProcessing(null)
    }
  }

  if (milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No payment milestones defined.</p>
        </CardContent>
      </Card>
    )
  }

  const totalPaid = milestones.reduce(
    (sum, m) => (m.status === "paid" ? sum + m.amount : sum),
    0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Milestones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{milestone.name}</p>
                {milestone.status === "paid" && (
                  <Badge variant="default">Paid</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                ${milestone.amount.toFixed(2)}
                {milestone.percentage !== null &&
                  ` (${milestone.percentage}%)`}
              </p>
              {milestone.paid_at && (
                <p className="text-xs text-muted-foreground">
                  Paid on {new Date(milestone.paid_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button
              onClick={() => handlePayment(milestone)}
              disabled={milestone.status === "paid" || processing === milestone.id}
            >
              {processing === milestone.id
                ? "Processing..."
                : milestone.status === "paid"
                  ? "Paid"
                  : "Pay Now"}
            </Button>
          </div>
        ))}
        <div className="border-t pt-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Paid:</span>
            <span className="font-semibold">${totalPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total Amount:</span>
            <span className="font-semibold">${booking.total_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-sm font-semibold">
            <span>Remaining:</span>
            <span>${(booking.total_price - totalPaid).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



