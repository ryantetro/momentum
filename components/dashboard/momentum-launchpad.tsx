"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, Circle, X, Copy, Check, CreditCard, FileText, Link2, Instagram } from "lucide-react"
import { useToast } from "@/components/ui/toaster"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getInquiryUrl, copyInquiryLink } from "@/lib/inquiry-link"
import {
  getRequirementState,
  getRequirementMessage,
  isRestricted,
  hasCurrentlyDue,
  type StripeRequirements,
} from "@/lib/stripe/requirements"
import { AlertTriangle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface LaunchpadProps {
  stripeConnected: boolean
  contractSet: boolean
  inquiryLinkShared: boolean
  username: string | null
  stripeRequirements?: StripeRequirements | null
}

interface LaunchpadItem {
  id: string
  title: string
  description: string
  completed: boolean
  action: {
    label: string
    href?: string
    onClick?: () => void
  }
  icon: React.ComponentType<{ className?: string }>
}

export function MomentumLaunchpad({
  stripeConnected,
  contractSet,
  inquiryLinkShared,
  username,
  stripeRequirements = null,
}: LaunchpadProps) {
  const supabase = createClient()
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [instagramDialogOpen, setInstagramDialogOpen] = useState(false)
  const [linkCopiedOnce, setLinkCopiedOnce] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissedState = localStorage.getItem("momentum_launchpad_dismissed")
      setDismissed(dismissedState === "true")
      const copiedState = localStorage.getItem("momentum_inquiry_link_copied")
      setLinkCopiedOnce(copiedState === "true")
    }
  }, [])

  const inquiryUrl = getInquiryUrl(username)

  const handleCopyInquiryLink = async () => {
    if (!inquiryUrl) {
      toast({
        title: "No inquiry link",
        description: "Your username is being generated. Please try again in a moment.",
        variant: "destructive",
      })
      return
    }

    try {
      await copyInquiryLink(inquiryUrl)
      setCopied(true)
      setLinkCopiedOnce(true)
      if (typeof window !== "undefined") {
        localStorage.setItem("momentum_inquiry_link_copied", "true")
      }
      toast({
        title: "Link copied",
        description: "Your inquiry link has been copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleCopyForInstagram = async () => {
    if (!inquiryUrl) return

    try {
      await copyInquiryLink(inquiryUrl)
      setCopied(true)
      setLinkCopiedOnce(true)
      if (typeof window !== "undefined") {
        localStorage.setItem("momentum_inquiry_link_copied", "true")
      }
      toast({
        title: "Link copied",
        description: "Paste this link into your Instagram Website field",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("momentum_launchpad_dismissed", "true")
      setDismissed(true)
      toast({
        title: "Launchpad dismissed",
        description: "You can always find setup options in Settings",
      })
    }
  }

  const handleCompleteVerification = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Error",
          description: "Please log in to complete verification",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/stripe/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type: "account_update" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create verification link")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start verification",
        variant: "destructive",
      })
    }
  }

  // Determine Stripe item state
  const stripeRequirementState = getRequirementState(stripeConnected, stripeRequirements)
  const stripeRequirementMessage = getRequirementMessage(stripeRequirements)
  const hasStripeRequirements = isRestricted(stripeRequirements) || hasCurrentlyDue(stripeRequirements)
  
  // Stripe is "complete" only if connected AND no requirements
  const stripeCompleted = stripeConnected && !hasStripeRequirements
  
  // Determine button label and action for Stripe
  const stripeButtonLabel = hasStripeRequirements
    ? isRestricted(stripeRequirements)
      ? "Complete Verification"
      : "Finish Verification"
    : "Go to Settings"
  
  const stripeButtonAction = hasStripeRequirements
    ? { onClick: handleCompleteVerification }
    : { href: "/settings?tab=payments" }

  const items: LaunchpadItem[] = [
    {
      id: "stripe",
      title: "Connect Your Bank (Stripe)",
      description: stripeRequirementMessage || "You keep 100% of your service fee; we only charge the client a small tech fee.",
      completed: stripeCompleted,
      action: {
        label: stripeButtonLabel,
        ...stripeButtonAction,
      },
      icon: CreditCard,
    },
    {
      id: "contract",
      title: "Set Your Master Contract",
      description: "This will be used to automatically draft proposals whenever a new inquiry arrives.",
      completed: contractSet,
      action: {
        label: "Go to Settings",
        href: "/settings?tab=legal",
      },
      icon: FileText,
    },
    {
      id: "inquiry-link",
      title: "Share Your Inquiry Link",
      description: "Stop manual entry; let clients fill in their own details so you can focus on the shoot.",
      completed: inquiryLinkShared || linkCopiedOnce,
      action: {
        label: copied ? "Copied!" : "Copy Link",
        onClick: handleCopyInquiryLink,
      },
      icon: Link2,
    },
  ]

  const completedCount = items.filter((item) => item.completed).length
  const total = items.length
  const percentage = (completedCount / total) * 100
  const allComplete = completedCount === total

  // Don't show if dismissed and all complete
  if (dismissed && allComplete) {
    return null
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">🚀</span>
              Momentum Launchpad
            </CardTitle>
            <CardDescription className="mt-2">
              Complete these 3 steps to unlock the full power of Momentum
            </CardDescription>
          </div>
          {allComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {completedCount}/{total} Complete
            </span>
            <span className="text-muted-foreground">{Math.round(percentage)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {/* Checklist Items */}
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon
            // Determine state for Stripe item
            const isStripeItem = item.id === "stripe"
            const itemState = isStripeItem ? stripeRequirementState : (item.completed ? 'complete' : 'incomplete')
            const isError = isStripeItem && itemState === 'error'
            const isWarning = isStripeItem && itemState === 'warning'
            
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  item.completed && !isError && !isWarning
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : isError
                    ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 border-2"
                    : isWarning
                    ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                )}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {item.completed && !isError && !isWarning ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : isError ? (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : isWarning ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h4
                          className={cn(
                            "font-semibold text-sm",
                            item.completed && !isError && !isWarning
                              ? "text-green-900 dark:text-green-100 line-through"
                              : isError
                              ? "text-red-900 dark:text-red-100"
                              : isWarning
                              ? "text-yellow-900 dark:text-yellow-100"
                              : "text-foreground"
                          )}
                        >
                          {item.title}
                        </h4>
                      </div>
                      <p className={cn(
                        "text-xs mt-1",
                        isError
                          ? "text-red-700 dark:text-red-300"
                          : isWarning
                          ? "text-yellow-700 dark:text-yellow-300"
                          : "text-muted-foreground"
                      )}>
                        {item.description}
                      </p>
                    </div>
                    {(!item.completed || isError || isWarning) && (
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {item.id === "inquiry-link" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => setInstagramDialogOpen(true)}
                          >
                            <Instagram className="mr-1 h-3 w-3" />
                            Instagram Bio
                          </Button>
                        )}
                        {item.action.href ? (
                          <Link href={item.action.href}>
                            <Button 
                              size="sm" 
                              variant={isError ? "default" : isWarning ? "default" : "outline"} 
                              className={cn(
                                "text-xs",
                                isError && "bg-red-600 hover:bg-red-700 text-white",
                                isWarning && "bg-yellow-600 hover:bg-yellow-700 text-white"
                              )}
                            >
                              {item.action.label}
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            variant={isError ? "default" : isWarning ? "default" : "outline"}
                            className={cn(
                              "text-xs",
                              isError && "bg-red-600 hover:bg-red-700 text-white",
                              isWarning && "bg-yellow-600 hover:bg-yellow-700 text-white"
                            )}
                            onClick={item.action.onClick}
                          >
                            {item.action.label === "Copied!" ? (
                              <>
                                <Check className="mr-1 h-3 w-3 text-green-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                {item.id === "stripe" && (isError || isWarning) ? (
                                  <CreditCard className="mr-1 h-3 w-3" />
                                ) : item.id === "inquiry-link" ? (
                                  <Copy className="mr-1 h-3 w-3" />
                                ) : null}
                                {item.action.label}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {allComplete && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground text-center">
              🎉 All set! You're ready to start using Momentum. Dismiss this card when you're done.
            </p>
          </div>
        )}
      </CardContent>

      {/* Instagram Bio Dialog */}
      <Dialog open={instagramDialogOpen} onOpenChange={setInstagramDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Add to Instagram Bio
            </DialogTitle>
            <DialogDescription>
              Copy this link and paste it into your Instagram Website field to automate your lead capture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Your Inquiry Link:</p>
              <p className="text-sm font-mono break-all">{inquiryUrl || "Loading..."}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleCopyForInstagram} className="w-full">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Then go to Instagram → Edit Profile → Website and paste the link
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstagramDialogOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

