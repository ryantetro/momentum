"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { EnablePaymentsButton } from "@/components/dashboard/enable-payments-button"
import { CreditCard, ExternalLink, CheckCircle2 } from "lucide-react"
import type { Photographer } from "@/types"

export function PaymentSettings() {
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <CardDescription>
          Manage your payment processing and Stripe Connect integration
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
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Your payment setup:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Payments are automatically processed when clients pay</li>
                <li>You receive 96.5% of each payment (3.5% transaction fee added to client total)</li>
                <li>Funds are deposited to your linked bank account within 2 business days</li>
                <li>All transactions are secure and PCI-compliant</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

