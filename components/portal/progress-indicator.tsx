"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { motion } from "framer-motion"
import type { Booking } from "@/types"

interface ProgressIndicatorProps {
  booking: Booking
  isSigned?: boolean // Optional prop to override from local state for immediate updates
}

export function ProgressIndicator({ booking, isSigned: isSignedProp }: ProgressIndicatorProps) {
  const hasContract = !!booking.contract_text
  const isSigned = isSignedProp !== undefined ? isSignedProp : !!booking.contract_signed_at
  const isPaid = booking.payment_status === "DEPOSIT_PAID" || booking.payment_status === "paid"

  const steps = [
    {
      id: 1,
      label: "Review Proposal",
      completed: true,
      active: false,
    },
    {
      id: 2,
      label: "Sign Contract",
      completed: isSigned,
      active: !isSigned,
    },
    {
      id: 3,
      label: "Pay Deposit",
      completed: isPaid,
      active: isSigned && !isPaid,
    },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto relative px-4">
      {/* Background Connector Line */}
      <div className="absolute top-6 md:top-7 left-12 right-12 h-1 bg-gray-200 -z-0 rounded-full" />

      {/* Active Connector Line */}
      <motion.div
        className="absolute top-6 md:top-7 left-12 h-1 bg-green-500 -z-0 rounded-full origin-left"
        initial={{ scaleX: 0 }}
        animate={{
          scaleX: isPaid ? 1 : isSigned ? 0.5 : 0
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ width: 'calc(100% - 6rem)' }}
      />

      <div className="flex items-center justify-between relative z-10">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            {/* Step Circle */}
            <motion.div
              className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border-2 transition-all ${step.completed
                ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/50"
                : step.active
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/50 ring-4 ring-blue-200/50"
                  : "bg-white border-gray-300 text-gray-400"
                }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={
                step.active
                  ? {
                    scale: [1, 1.15, 1],
                    opacity: 1,
                    boxShadow: [
                      "0 0 0 0px rgba(37, 99, 235, 0.4)",
                      "0 0 0 12px rgba(37, 99, 235, 0)",
                      "0 0 0 0px rgba(37, 99, 235, 0)",
                    ],
                  }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                step.active
                  ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                  : { duration: 0.3 }
              }
            >
              {step.completed ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="h-6 w-6 md:h-7 md:w-7" />
                </motion.div>
              ) : (
                <Circle className="h-6 w-6 md:h-7 md:w-7" />
              )}
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`mt-3 text-[10px] md:text-sm font-medium text-center max-w-[80px] md:max-w-[100px] ${step.completed
                ? "text-green-600 font-semibold"
                : step.active
                  ? "text-blue-600 font-semibold"
                  : "text-gray-500"
                }`}
            >
              {step.label}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  )
}

