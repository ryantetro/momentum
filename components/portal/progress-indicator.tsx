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
      completed: hasContract,
      active: hasContract && !isSigned,
    },
    {
      id: 2,
      label: "Sign Contract",
      completed: isSigned,
      active: isSigned && !isPaid,
    },
    {
      id: 3,
      label: "Pay Deposit",
      completed: isPaid,
      active: false,
    },
  ]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <motion.div
                className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border-2 transition-all ${
                  step.completed
                    ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/50"
                    : step.active
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/50 ring-4 ring-blue-200/50"
                    : "bg-white/60 border-gray-300 text-gray-400 backdrop-blur-sm"
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
                className={`mt-3 text-xs md:text-sm font-medium text-center max-w-[100px] ${
                  step.completed
                    ? "text-green-600 font-semibold"
                    : step.active
                    ? "text-blue-600 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </motion.span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <motion.div
                className={`flex-1 h-1 mx-2 md:mx-4 rounded-full transition-all ${
                  step.completed ? "bg-green-500" : "bg-gray-200"
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

