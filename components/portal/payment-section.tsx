"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Booking } from "@/types"
import { useToast } from "@/components/ui/toaster"

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
      // Create checkout session for deposit
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
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

  const remainingBalance = booking.total_price - depositAmount

  return (
    <Card className="border border-stone-200 shadow-xl bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-stone-200">
        <CardTitle className="font-serif text-3xl text-stone-900">Payment Summary</CardTitle>
        <p className="text-sm text-stone-600 mt-2">
          Secure your date by paying your deposit today
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        {/* Receipt-style breakdown */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-stone-600">Total Price:</span>
            <span className="font-semibold text-stone-900">${booking.total_price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-stone-600">Deposit Due Today:</span>
            <span className="font-semibold text-blue-600">${depositAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 text-sm">
            <span className="text-stone-500">Transaction Fee (3.5%):</span>
            <span className="text-stone-600">${transactionFee.toFixed(2)}</span>
          </div>
          {remainingBalance > 0 && (
            <div className="flex justify-between items-center py-2 text-sm border-t border-stone-200 pt-3">
              <span className="text-stone-500">Remaining Balance:</span>
              <span className="font-medium text-stone-700">${remainingBalance.toLocaleString()}</span>
            </div>
          )}
          
          {/* Dashed line separator */}
          <div className="border-t-2 border-dashed border-stone-300 my-4" />
          
          {/* Total Due - Large and prominent */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-xl font-bold text-stone-900">Total Due Today:</span>
            <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handlePayment}
            disabled={processing || !booking.contract_signed_at}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all text-lg py-6 font-semibold"
            size="lg"
          >
          {processing ? (
            <>
              <svg
                className="mr-2 h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </>
          ) : !booking.contract_signed_at ? (
            "Please sign the contract first"
          ) : (
            <>
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Secure Your Date: Pay ${depositAmount.toFixed(2)} Deposit
            </>
          )}
          </Button>
        </motion.div>
        
        {/* Secure Checkout Footer */}
        <div className="pt-6 border-t border-stone-200">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="font-semibold text-stone-700">Secure Checkout</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <span className="font-semibold text-blue-600">Stripe</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l-2.847 6.015c-.48-.207-1.129-.489-1.691-.756zm-2.95 5.847c-1.44-.75-2.633-1.407-2.633-2.404 0-.622.5-1.095 1.43-1.095 1.728 0 3.457.858 4.726 1.631l-2.847 6.015c-.48-.207-1.129-.489-1.691-.756zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
                <span className="text-xs text-stone-600 font-medium">Visa</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 1.5c5.799 0 10.5 4.701 10.5 10.5S17.799 22.5 12 22.5 1.5 17.799 1.5 12 6.201 1.5 12 1.5zm5.5 6h-11v9h11v-9zm-1.5 1.5v6h-8v-6h8z"/>
                </svg>
                <span className="text-xs text-stone-600 font-medium">Mastercard</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

