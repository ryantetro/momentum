"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle2, CreditCard } from "lucide-react"
import type { Booking } from "@/types"

interface StickyActionFooterProps {
  booking: Booking
  isSigned: boolean
  onSignClick?: () => void
  onPayClick?: () => void
  signing?: boolean
  paying?: boolean
}

export function StickyActionFooter({
  booking,
  isSigned,
  onSignClick,
  onPayClick,
  signing = false,
  paying = false,
}: StickyActionFooterProps) {
  const hasContract = !!booking.contract_text
  const isPaid = booking.payment_status === "DEPOSIT_PAID" || booking.payment_status === "paid"
  const needsPayment = isSigned && !isPaid && booking.contract_signed_at

  // Don't show if everything is complete or no contract
  if (!hasContract || (isSigned && isPaid)) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="bg-white border-t border-stone-200 shadow-2xl px-4 py-4">
          {!isSigned && hasContract && onSignClick ? (
            <Button
              onClick={onSignClick}
              disabled={signing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              size="lg"
            >
              {signing ? (
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
                  Signing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Sign Contract
                </>
              )}
            </Button>
          ) : needsPayment && onPayClick ? (
            <Button
              onClick={onPayClick}
              disabled={paying}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              size="lg"
            >
              {paying ? (
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
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay Deposit
                </>
              )}
            </Button>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

