"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"
import { Copy, Check, Send } from "lucide-react"

interface GenerateProposalButtonProps {
  bookingId: string
  photographerId: string
}

export function GenerateProposalButton({ bookingId, photographerId }: GenerateProposalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const handleGenerate = async () => {
    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        })
        return
      }

      // Get photographer's contract template
      const { data: photographer, error: photographerError } = await supabase
        .from("photographers")
        .select("contract_template")
        .eq("id", photographerId)
        .single()

      if (photographerError || !photographer) {
        throw new Error("Photographer not found")
      }

      if (!photographer.contract_template) {
        toast({
          title: "Error",
          description: "Please set up your contract template in Settings first",
          variant: "destructive",
        })
        return
      }

      // Get booking to get portal token
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("portal_token, client_id, service_type, event_date, total_price, clients(*)")
        .eq("id", bookingId)
        .single()

      if (bookingError || !booking) {
        throw new Error("Booking not found")
      }

      // Replace placeholders in contract template
      const contractText = photographer.contract_template
        .replace(/\{\{client_name\}\}/g, (booking.clients as any)?.name || "Client")
        .replace(/\{\{event_date\}\}/g, new Date(booking.event_date).toLocaleDateString())
        .replace(/\{\{total_price\}\}/g, `$${booking.total_price.toLocaleString()}`)
        .replace(/\{\{service_type\}\}/g, booking.service_type)

      // Update booking with contract text and status
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          contract_text: contractText,
          status: "PROPOSAL_SENT",
          payment_status: "PENDING_DEPOSIT",
        })
        .eq("id", bookingId)

      if (updateError) throw updateError

      // Generate portal URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const url = `${baseUrl}/portal/${booking.portal_token}`
      setPortalUrl(url)

      toast({ title: "Proposal link generated successfully!" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate proposal link",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!portalUrl) return

    try {
      await navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      toast({ title: "Link copied to clipboard!" })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proposal Link</CardTitle>
        <CardDescription>
          Generate a secure link to send to your client for contract signing and payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!portalUrl ? (
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Generating..." : "Generate & Send Proposal Link"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm font-medium mb-2">Client Portal Link:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs break-all bg-background px-2 py-1 rounded">
                  {portalUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Send this link to your client via email. They can use it to sign the contract and make the deposit payment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

