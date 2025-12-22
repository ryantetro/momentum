"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"
import { EnablePaymentsButton } from "@/components/dashboard/enable-payments-button"
import { CreditCard, ExternalLink, CheckCircle2, Loader2 } from "lucide-react"
import type { Photographer } from "@/types"

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
]

export function PaymentsTab() {
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Form state
  const [defaultCurrency, setDefaultCurrency] = useState("USD")
  const [passFeesToClient, setPassFeesToClient] = useState(true)

  useEffect(() => {
    async function fetchPhotographer() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        const { data } = await supabase
          .from("photographers")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (data) {
          setPhotographer(data)
          setDefaultCurrency(data.default_currency || "USD")
          setPassFeesToClient(data.pass_fees_to_client ?? true)
        }
      } catch (error) {
        console.error("Error fetching photographer:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotographer()
  }, [supabase])

  const handleViewStripeDashboard = () => {
    if (photographer?.stripe_account_id) {
      window.open(
        `https://dashboard.stripe.com/connect/accounts/${photographer.stripe_account_id}`,
        "_blank"
      )
    }
  }

  const handleSave = async () => {
    if (!photographer) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from("photographers")
        .update({
          default_currency: defaultCurrency,
          pass_fees_to_client: passFeesToClient,
        })
        .eq("id", photographer.id)

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "Your payment settings have been updated",
      })
    } catch (error: any) {
      console.error("Error saving payment settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  const hasStripeAccount = !!photographer?.stripe_account_id

  return (
    <div className="space-y-6">
      {/* Stripe Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to enable secure payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasStripeAccount ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Enable secure payments and automated invoicing. No monthly fees.
                </p>
                <EnablePaymentsButton />
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">What happens when you connect Stripe:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Accept payments directly from your clients</li>
                  <li>Automated payment reminders and tracking</li>
                  <li>Funds deposited to your bank account in 2 days</li>
                  <li>Professional, secure payment processing</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Payments Active
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Your Stripe account is connected and ready to accept payments.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Stripe Account ID</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {photographer.stripe_account_id}
                  </p>
                </div>
                <Button
                  onClick={handleViewStripeDashboard}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Stripe Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Settings */}
      {hasStripeAccount && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Preferences</CardTitle>
            <CardDescription>
              Configure your default payment settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                id="currency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                This currency will be used for all new payment requests
              </p>
            </div>

            {/* Fee Transparency Toggle */}
            <div className="space-y-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="fee-transparency" className="text-base font-semibold">
                    Pass transaction fees to client?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, the 3.5% platform fee is added to the client's total, ensuring you receive 100% of your base price. When
                    disabled, the fee is deducted from your payout.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="fee-transparency"
                    checked={passFeesToClient}
                    onChange={(e) => setPassFeesToClient(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">Current setting:</p>
                <p>
                  {passFeesToClient
                    ? "✓ Fees are added to client's total (recommended)"
                    : "✗ Fees are deducted from your payout"}
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



