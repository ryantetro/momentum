"use client"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react"

interface LegalProtection {
  name: string
  present: boolean
  notes?: string
}

interface RiskScoreMeterProps {
  legalProtections: LegalProtection[]
  className?: string
}

export function RiskScoreMeter({ legalProtections, className }: RiskScoreMeterProps) {
  if (!legalProtections || legalProtections.length === 0) {
    return null
  }

  const totalCount = legalProtections.length
  const presentCount = legalProtections.filter((p) => p.present).length
  const score = Math.round((presentCount / totalCount) * 100)

  // Determine risk level and color
  let riskLevel: "high" | "moderate" | "low"
  let riskColor: string
  let riskText: string
  let Icon: React.ComponentType<{ className?: string }>

  if (score <= 40) {
    riskLevel = "high"
    riskColor = "bg-red-500"
    riskText = "High Risk"
    Icon = AlertTriangle
  } else if (score <= 70) {
    riskLevel = "moderate"
    riskColor = "bg-yellow-500"
    riskText = "Moderate Risk"
    Icon = AlertTriangle
  } else {
    riskLevel = "low"
    riskColor = "bg-green-500"
    riskText = "Professional Grade"
    Icon = CheckCircle2
  }

  return (
    <div className={cn("space-y-3 p-4 rounded-lg border bg-background", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Legal Protection Score</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4",
              riskLevel === "high" && "text-red-600",
              riskLevel === "moderate" && "text-yellow-600",
              riskLevel === "low" && "text-green-600"
            )}
          />
          <span
            className={cn(
              "text-sm font-bold",
              riskLevel === "high" && "text-red-600",
              riskLevel === "moderate" && "text-yellow-600",
              riskLevel === "low" && "text-green-600"
            )}
          >
            {score}%
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <Progress
          value={score}
          className={cn(
            "h-2",
            riskLevel === "high" && "[&>div]:bg-red-500",
            riskLevel === "moderate" && "[&>div]:bg-yellow-500",
            riskLevel === "low" && "[&>div]:bg-green-500"
          )}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{riskText}</span>
          <span>
            {presentCount} of {totalCount} protections present
          </span>
        </div>
      </div>
    </div>
  )
}



