"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ClientStatusBadgeProps {
  status: "Inquiry" | "Active" | "Past"
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const statusConfig = {
    Inquiry: {
      label: "Inquiry",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    Active: {
      label: "Active",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    Past: {
      label: "Past",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    },
  }

  const config = statusConfig[status]

  return (
    <Badge className={cn("text-xs font-semibold px-2 py-1", config.className)}>
      {config.label}
    </Badge>
  )
}

