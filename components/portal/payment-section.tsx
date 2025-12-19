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

  const depositAmount = booking.deposit_amount ?? (booking.total_price * 0.2)
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
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-stone-200 p-6 md:p-8">
        <CardTitle className="font-serif text-2xl md:text-3xl text-stone-900">Payment Summary</CardTitle>
        <p className="text-sm text-stone-600 mt-2">
          Secure your date by paying your deposit today
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-4 md:p-8">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-2">
            <span className="text-xl font-bold text-stone-900">Total Due Today:</span>
            <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all text-base md:text-lg py-6 md:py-8 font-semibold h-auto whitespace-normal text-center"
            size="lg"
          >
            {processing ? (
              <>
                <svg
                  className="mr-2 h-5 w-5 animate-spin flex-shrink-0"
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
                <span>Processing...</span>
              </>
            ) : !booking.contract_signed_at ? (
              "Please sign the contract first"
            ) : (
              <div className="flex items-center justify-center">
                <svg
                  className="mr-2 h-5 w-5 flex-shrink-0"
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
                <span>Secure Your Date: Pay ${depositAmount.toFixed(2)} Deposit</span>
              </div>
            )}
          </Button>
        </motion.div>

        {/* Secure Checkout Footer */}
        <div className="pt-6 border-t border-stone-200">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="font-semibold text-stone-700 uppercase tracking-wider text-[10px]">Secure Checkout Powered by Stripe</span>
            </div>
            <div className="flex items-center justify-center gap-8">
              {/* Stripe Logo */}
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto" fill="#635BFF">
                <title>Stripe</title>
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
              </svg>

              {/* Visa Logo */}
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto" fill="#1A1F71">
                <title>Visa</title>
                <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z" />
              </svg>

              {/* Mastercard Logo */}
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
                <title>Mastercard</title>
                <path d="M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031z" fill="#EB001B" />
                <path d="M16.584 4.584c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416z" fill="#F79E1B" />
                <path d="M12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08-.184-.156-.28-.231z" fill="#FF5F00" />
              </svg>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

