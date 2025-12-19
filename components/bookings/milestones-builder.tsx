"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MilestoneItem } from "./milestone-item"
import { Plus } from "lucide-react"
import type { PaymentMilestone } from "@/types"

interface MilestonesBuilderProps {
  totalPrice: number
  milestones: PaymentMilestone[]
  onChange: (milestones: PaymentMilestone[]) => void
}

export function MilestonesBuilder({
  totalPrice,
  milestones,
  onChange,
}: MilestonesBuilderProps) {
  const addMilestone = () => {
    const newMilestone: PaymentMilestone = {
      id: Math.random().toString(36).substring(7),
      name: "",
      amount: 0,
      percentage: null,
      due_date: null,
      status: "pending",
      paid_at: null,
      stripe_payment_intent_id: null,
    }
    onChange([...milestones, newMilestone])
  }

  const updateMilestone = (index: number, milestone: PaymentMilestone) => {
    const updated = [...milestones]
    updated[index] = milestone
    onChange(updated)
  }

  const deleteMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index)
    onChange(updated)
  }

  const totalMilestones = milestones.reduce((sum, m) => sum + m.amount, 0)
  const difference = totalPrice - totalMilestones

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payment Milestones</h3>
          <p className="text-sm text-muted-foreground">
            Define payment schedule for this booking
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addMilestone}>
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            No milestones yet. Add your first payment milestone.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              totalPrice={totalPrice}
              onUpdate={(updated) => updateMilestone(index, updated)}
              onDelete={() => deleteMilestone(index)}
            />
          ))}
        </div>
      )}

      {milestones.length > 0 && (
        <div className="rounded-lg border bg-muted p-4">
          <div className="flex justify-between text-sm">
            <span>Total Milestones:</span>
            <span className="font-semibold">${totalMilestones.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Booking Total:</span>
            <span className="font-semibold">${totalPrice.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
            <span>Difference:</span>
            <span className={difference === 0 ? "text-green-600" : "text-destructive"}>
              ${difference.toFixed(2)}
            </span>
          </div>
          {difference !== 0 && (
            <p className="mt-2 text-xs text-destructive">
              Milestone amounts must equal the booking total
            </p>
          )}
        </div>
      )}
    </div>
  )
}



