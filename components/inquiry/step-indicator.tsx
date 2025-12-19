"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isCompleted = step < currentStep
        const isCurrent = step === currentStep

        return (
          <div key={step} className="flex items-center">
            {/* Step Circle */}
            <motion.div
              initial={false}
              animate={{
                scale: isCurrent ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                isCompleted
                  ? "bg-blue-600 border-blue-600 text-white"
                  : isCurrent
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300 text-gray-400"
              )}
            >
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{step}</span>
              )}
            </motion.div>

            {/* Connector Line */}
            {step < totalSteps && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2 transition-all",
                  isCompleted ? "bg-blue-600" : "bg-gray-300"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

