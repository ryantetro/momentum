"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import { Copy, Check, Mail } from "lucide-react"

interface ProposalEmailTemplateProps {
  clientName: string
  photographerName: string
  serviceType: string
  portalUrl: string
}

export function ProposalEmailTemplate({
  clientName,
  photographerName,
  serviceType,
  portalUrl,
}: ProposalEmailTemplateProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Capitalize service type
  const capitalizedServiceType =
    serviceType.charAt(0).toUpperCase() + serviceType.slice(1)

  // Generate email subject
  const subject = `Proposal & Contract for your ${capitalizedServiceType} with ${photographerName}`

  // Generate email body
  const emailBody = `Hi ${clientName},

It was such a pleasure speaking with you about your ${capitalizedServiceType}! I am so excited about the possibility of capturing these memories for you.

To make things as simple and secure as possible, I use Momentum to handle my bookings. I've created a private portal for you where you can review our agreement and handle the deposit in one place.

You can access your secure portal here: ${portalUrl}

What's inside the portal:

The Contract: Review and e-sign our agreement digitally.

Payment Schedule: See the breakdown for your deposit and future milestones.

Secure Checkout: Pay your deposit via credit card to officially lock in your date.

Once the contract is signed and the deposit is processed, your date will be officially marked as Booked on my calendar, and we can get started on the fun stuff!

If you have any questions at all, just hit reply.

Best,

${photographerName}`

  // Full email template with subject and body
  const fullEmailTemplate = `Subject: ${subject}

${emailBody}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullEmailTemplate)
      setCopied(true)
      toast({
        title: "Email template copied!",
        description: "Paste it into your email client to send to your client.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy email template",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Template
        </CardTitle>
        <CardDescription>
          Copy this professional email template to send to your client. Paste it into your email client (Gmail, Outlook, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Subject:</label>
          <div className="rounded-lg border bg-muted p-3">
            <p className="text-sm">{subject}</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Body:</label>
          <textarea
            readOnly
            value={emailBody}
            className="w-full min-h-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
        <Button onClick={handleCopy} className="w-full" size="lg">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied to Clipboard!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Email Template
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          The template includes both the subject and body. After copying, paste it into your email client and send from your own email address for maximum trust and deliverability.
        </p>
      </CardContent>
    </Card>
  )
}

