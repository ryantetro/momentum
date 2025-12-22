"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import type { PaymentMilestone } from "@/types"

interface MilestoneItemProps {
  milestone: PaymentMilestone
  totalPrice: number
  onUpdate: (milestone: PaymentMilestone) => void
  onDelete: () => void
}

export function MilestoneItem({
  milestone,
  totalPrice,
  onUpdate,
  onDelete,
}: MilestoneItemProps) {
  const handleTypeChange = (type: "percentage" | "fixed") => {
    if (type === "percentage") {
      onUpdate({
        ...milestone,
        percentage: milestone.percentage || 0,
        amount: (totalPrice * (milestone.percentage || 0)) / 100,
      })
    } else {
      onUpdate({
        ...milestone,
        percentage: null,
      })
    }
  }

  const handlePercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0
    onUpdate({
      ...milestone,
      percentage,
      amount: (totalPrice * percentage) / 100,
    })
  }

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0
    onUpdate({
      ...milestone,
      amount,
    })
  }

  const handleNameChange = (value: string) => {
    onUpdate({
      ...milestone,
      name: value,
    })
  }

  const isPercentage = milestone.percentage !== null

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <Label>Milestone Name</Label>
          <Input
            value={milestone.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Deposit, Final Payment"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={isPercentage ? "percentage" : "fixed"}
              onChange={(e) => handleTypeChange(e.target.value as "percentage" | "fixed")}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </Select>
          </div>
          {isPercentage ? (
            <div className="space-y-2">
              <Label>Percentage</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={milestone.percentage || 0}
                onChange={(e) => handlePercentageChange(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={milestone.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Amount: ${milestone.amount.toFixed(2)}</Label>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}





