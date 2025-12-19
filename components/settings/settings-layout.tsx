"use client"

import { useState, ReactNode } from "react"
import { User, CreditCard, FileText, Bell, Package } from "lucide-react"
import { cn } from "@/lib/utils"

type TabId = "profile" | "payments" | "legal" | "packages" | "notifications"

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: "profile", label: "Business Profile", icon: User },
  { id: "payments", label: "Payments & Payouts", icon: CreditCard },
  { id: "legal", label: "Contract Defaults", icon: FileText },
  { id: "packages", label: "Service Packages", icon: Package },
  { id: "notifications", label: "Notifications", icon: Bell },
]

interface SettingsLayoutProps {
  children: (activeTab: TabId, setActiveTab: (tab: TabId) => void) => ReactNode
  defaultTab?: TabId
}

export function SettingsLayout({ children, defaultTab = "profile" }: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>{children(activeTab, setActiveTab)}</div>
    </div>
  )
}

