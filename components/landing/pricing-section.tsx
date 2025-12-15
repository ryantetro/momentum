"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import { ScrollAnimation } from "./scroll-animation"

export function PricingSection() {
  return (
    <section id="pricing" className="container mx-auto px-4 py-20 md:py-32">
      <div className="mx-auto max-w-4xl">
        <ScrollAnimation>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No monthly fees. No hidden costs. Just a small transaction fee when you get paid.
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Pricing Table */}
          <ScrollAnimation delay={100}>
            <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Momentum Free Model</CardTitle>
              <CardDescription>
                Everything you need to manage your photography business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monthly Fee</span>
                  <span className="text-2xl font-bold">$0</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground">Transaction Fee</span>
                  <span className="text-2xl font-bold text-amber-600">3.5%</span>
                </div>
                <p className="text-sm text-muted-foreground pt-2">
                  Paid by the client, not you
                </p>
              </div>
              <div className="pt-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited bookings</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited clients</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Contract templates</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Payment automation</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Client portal</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </ScrollAnimation>

          {/* Calculator Example */}
          <ScrollAnimation delay={200}>
            <Card className="border-2 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-xl">See How It Works</CardTitle>
              <CardDescription>
                Example pricing breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Wedding Package</span>
                  <span className="font-semibold">$5,000</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground">Transaction Fee (3.5%)</span>
                  <span className="font-semibold">$175</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="font-semibold">Client Pays Total</span>
                  <span className="text-2xl font-bold text-blue-600">$5,175</span>
                </div>
                <p className="text-sm text-muted-foreground pt-2">
                  You receive $5,000. The $175 fee is added to the client's total.
                </p>
              </div>
              <div className="pt-4 p-4 bg-background rounded-lg border">
                <p className="text-sm font-medium mb-2">Your Revenue:</p>
                <p className="text-2xl font-bold text-green-600">$5,000</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No monthly subscription. No setup fees.
                </p>
              </div>
            </CardContent>
          </Card>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  )
}

