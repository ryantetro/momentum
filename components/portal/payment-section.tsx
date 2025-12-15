"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadStripe } from "@stripe/stripe-js"
import type { Booking } from "@/types"
import { useToast } from "@/components/ui/toaster"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentSectionProps {
  booking: Booking
}

export function PaymentSection({ booking }: PaymentSectionProps) {
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  const depositAmount = booking.deposit_amount 
    ? parseFloat(booking.deposit_amount.toString())
    : (typeof booking.total_price === 'number' ? booking.total_price : parseFloat(booking.total_price.toString())) * 0.2 // Default to 20% if not set
  const transactionFee = depositAmount * 0.035 // 3.5% fee
  const totalAmount = depositAmount + transactionFee

  const handlePayment = async () => {
    setProcessing(true)

    try {
      // Create payment intent for deposit
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: depositAmount,
          type: "deposit",
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
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deposit Amount:</span>
            <span className="font-semibold">${depositAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction Fee (3.5%):</span>
            <span className="font-semibold">${transactionFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <Button
          onClick={handlePayment}
          disabled={processing}
          className="w-full"
          size="lg"
        >
          {processing ? "Processing..." : `Pay Deposit - $${totalAmount.toFixed(2)}`}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Secure payment processed by Stripe
        </p>
      </CardContent>
    </Card>
  )
}

