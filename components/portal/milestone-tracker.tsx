"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"
import type { Booking } from "@/types"

interface MilestoneTrackerProps {
  booking: Booking
}

export function MilestoneTracker({ booking }: MilestoneTrackerProps) {
  const milestones = [
    {
      id: "inquiry",
      label: "Inquiry Received",
      completed: true,
    },
    {
      id: "proposal",
      label: "Proposal Sent",
      completed: !!booking.contract_text,
    },
    {
      id: "signature",
      label: "Contract Signed",
      completed: !!booking.contract_signed_at,
    },
    {
      id: "deposit",
      label: "Deposit Paid",
      completed: booking.payment_status === "DEPOSIT_PAID" || booking.payment_status === "paid",
    },
  ]

  const completedCount = milestones.filter((m) => m.completed).length
  const progressPercentage = (completedCount / milestones.length) * 100

  return (
    <Card className="border border-stone-200 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Booking Progress</CardTitle>
        <p className="text-sm text-stone-600 mt-1">
          Track your booking journey from inquiry to confirmation
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Progress</span>
              <span className="font-semibold text-stone-900">{completedCount} of {milestones.length} completed</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4 pt-2">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {milestone.completed ? (
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-stone-300 bg-white flex items-center justify-center">
                      <Circle className="h-5 w-5 text-stone-400" fill="currentColor" />
                    </div>
                  )}
                  {index < milestones.length - 1 && (
                    <div
                      className={`w-0.5 h-8 mt-1 ${
                        milestone.completed ? "bg-green-500" : "bg-stone-200"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p
                    className={`font-medium ${
                      milestone.completed
                        ? "text-stone-900"
                        : "text-stone-500"
                    }`}
                  >
                    {milestone.label}
                  </p>
                  {milestone.completed && (
                    <p className="text-xs text-stone-500 mt-0.5">
                      {milestone.id === "signature" && booking.contract_signed_at
                        ? `Signed on ${new Date(booking.contract_signed_at).toLocaleDateString()}`
                        : milestone.id === "deposit" && booking.payment_status === "DEPOSIT_PAID"
                        ? "Deposit received"
                        : "Completed"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

