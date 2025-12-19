"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { BusinessProfileTab } from "@/components/settings/business-profile-tab"
import { PaymentsTab } from "@/components/settings/payments-tab"
import { ContractDefaultsTab } from "@/components/settings/contract-defaults-tab"
import { ServicePackagesTab } from "@/components/settings/service-packages-tab"
import { NotificationsTab } from "@/components/settings/notifications-tab"

type TabId = "profile" | "payments" | "legal" | "packages" | "notifications"

function SettingsContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as TabId | null

  // Determine default tab based on URL param or default to profile
  const getDefaultTab = (): TabId => {
    if (tabParam && ["profile", "payments", "legal", "packages", "notifications"].includes(tabParam)) {
      return tabParam
    }
    return "profile"
  }

  return (
    <SettingsLayout defaultTab={getDefaultTab()}>
      {(activeTab, setActiveTab) => {
        switch (activeTab) {
          case "profile":
            return <BusinessProfileTab />
          case "payments":
            return <PaymentsTab />
          case "legal":
            return <ContractDefaultsTab />
          case "packages":
            return <ServicePackagesTab />
          case "notifications":
            return <NotificationsTab />
          default:
            return <BusinessProfileTab />
        }
      }}
    </SettingsLayout>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business profile, payments, contracts, and notifications
        </p>
      </div>
      <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
        <SettingsContent />
      </Suspense>
    </div>
  )
}

