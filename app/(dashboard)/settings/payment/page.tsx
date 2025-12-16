import { PaymentSettings } from "@/components/settings/payment-settings"

export default function PaymentSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-muted-foreground">
          Connect your Stripe account to enable secure payments and automated invoicing
        </p>
      </div>
      <PaymentSettings />
    </div>
  )
}

