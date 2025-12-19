"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag } from "lucide-react"
import { cn } from "@/lib/utils"

interface Variable {
  key: string
  label: string
  description: string
}

const VARIABLES: Variable[] = [
  {
    key: "{{client_name}}",
    label: "Client Name",
    description: "Full name of the client",
  },
  {
    key: "{{event_date}}",
    label: "Event Date",
    description: "Formatted event date",
  },
  {
    key: "{{total_price}}",
    label: "Total Price",
    description: "Total price with currency",
  },
  {
    key: "{{service_type}}",
    label: "Service Type",
    description: "Type of service (e.g., Wedding, Portrait)",
  },
]

interface VariablesSidebarProps {
  onInsertVariable: (variable: string) => void
}

export function VariablesSidebar({ onInsertVariable }: VariablesSidebarProps) {
  return (
    <Card className="h-fit border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Variables
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Click to insert into contract
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0">
        {VARIABLES.map((variable) => (
          <button
            key={variable.key}
            onClick={() => onInsertVariable(variable.key)}
            className={cn(
              "w-full text-left p-2.5 rounded-md border border-border/50",
              "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
              "transition-all duration-200 group cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            )}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <code className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 break-all leading-tight">
                {variable.key}
              </code>
              <span className="text-[10px] text-muted-foreground leading-tight break-words">
                {variable.description}
              </span>
            </div>
          </button>
        ))}
        <p className="text-xs text-muted-foreground pt-3 mt-3 border-t leading-relaxed">
          These placeholders will be automatically replaced with actual values when generating
          proposals.
        </p>
      </CardContent>
    </Card>
  )
}

