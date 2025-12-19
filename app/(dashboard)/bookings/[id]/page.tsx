"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GenerateProposalButton } from "@/components/bookings/generate-proposal-button"
import { ProposalEmailTemplate } from "@/components/bookings/proposal-email-template"
import { CustomFormBuilder } from "@/components/bookings/custom-form-builder"
import { FileUpload } from "@/components/bookings/file-upload"
import { InquiryConversionModal } from "@/components/bookings/inquiry-conversion-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, DollarSign, FileText, Copy, Check, Sparkles, RefreshCw } from "lucide-react"
import type { Booking, Client } from "@/types"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge"

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalUrlCopied, setPortalUrlCopied] = useState(false)
  const [conversionModalOpen, setConversionModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [emailTemplateData, setEmailTemplateData] = useState<{
    portalUrl: string
    clientName: string
    photographerName: string
    serviceType: string
  } | null>(null)
  const supabase = createClient()

  const fetchBooking = async (showLoading = false) => {
    if (showLoading) setRefreshing(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/sign-in")
        return
      }

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) {
        return
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*, clients(*)")
        .eq("id", bookingId)
        .eq("photographer_id", photographer.id)
        .single()

      if (error) throw error

      setBooking(data)

      // Check if proposal already exists and set email template data
      if (data && data.portal_token && (data.contract_text || data.status === "PROPOSAL_SENT" || data.status === "contract_sent")) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const portalUrl = `${baseUrl}/portal/${data.portal_token}`
        
        // Get photographer name
        const { data: photographerData } = await supabase
          .from("photographers")
          .select("business_name, email")
          .eq("id", photographer.id)
          .single()
        
        const client = Array.isArray(data.clients) ? data.clients[0] : data.clients
        const clientName = client?.name || "Client"
        const photographerName = photographerData?.business_name || photographerData?.email || "Photographer"
        
        setEmailTemplateData({
          portalUrl,
          clientName,
          photographerName,
          serviceType: data.service_type,
        })
      } else {
        // Clear email template data if proposal doesn't exist
        setEmailTemplateData(null)
      }
    } catch (error) {
      console.error("Error fetching booking:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchBooking(true)
    router.refresh()
  }

  useEffect(() => {
    fetchBooking()
    
    // Listen for booking updates
    const handleBookingUpdate = () => {
      fetchBooking()
      router.refresh()
    }
    
    window.addEventListener('booking-updated', handleBookingUpdate)
    
    // Set up Supabase real-time subscription for booking updates
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          console.log('Booking updated:', payload)
          fetchBooking()
          router.refresh()
        }
      )
      .subscribe()
    
    // Also poll for updates every 5 seconds as a fallback
    const pollInterval = setInterval(() => {
      fetchBooking()
    }, 5000)
    
    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBooking()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('booking-updated', handleBookingUpdate)
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      supabase.removeChannel(channel)
    }
  }, [bookingId, supabase, router])

  const handleConversionSuccess = () => {
    // Refresh booking data after successful conversion
    fetchBooking()
    setConversionModalOpen(false)
    router.refresh()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!booking) {
    return <div>Booking not found</div>
  }

  const client = booking.client as Client

  // Calculate payment information
  const totalPaid = booking.payment_milestones?.reduce(
    (sum: number, m: any) => (m.status === "paid" ? sum + m.amount : sum),
    booking.payment_status === "DEPOSIT_PAID" ? (booking.deposit_amount || 0) : 0
  ) || 0
  const balanceDue = booking.total_price - totalPaid
  const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const portalUrl = `${baseUrl}/portal/${booking.portal_token}`

  const handleCopyPortalUrl = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl)
      setPortalUrlCopied(true)
      setTimeout(() => setPortalUrlCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy portal URL:", error)
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bookings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
            <p className="text-muted-foreground">
              {client?.name} - {format(new Date(booking.event_date), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Inquiry Conversion Banner - Only show for Inquiry status */}
      {booking.status === "Inquiry" && (
        <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                  New Inquiry
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a new inquiry from a potential client. Convert it to a booking to set pricing and send a proposal.
                </p>
                {booking.inquiry_message && (
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Client Message:</p>
                    <p className="text-sm italic">"{booking.inquiry_message}"</p>
                  </div>
                )}
              </div>
              <Button
                onClick={() => setConversionModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white ml-4"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Convert to Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Booking Banner - Show when deposit is paid and booking is active */}
      {booking.status === "Active" && booking.payment_status === "DEPOSIT_PAID" && (
        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Active Booking
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your client has signed the contract and paid the deposit. This booking is now confirmed!
                </p>
                <div className="grid gap-3 md:grid-cols-2 mt-4">
                  {booking.deposit_amount && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Deposit Paid</p>
                      <p className="text-lg font-semibold text-green-600">
                        ${booking.deposit_amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Event Date</p>
                    <p className="text-lg font-semibold">
                      {format(new Date(booking.event_date), "MMMM d, yyyy")}
                    </p>
                    {(() => {
                      const eventDate = new Date(booking.event_date)
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      eventDate.setHours(0, 0, 0, 0)
                      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      if (daysUntil > 0) {
                        return (
                          <p className="text-xs text-muted-foreground mt-1">
                            {daysUntil} {daysUntil === 1 ? "day" : "days"} away
                          </p>
                        )
                      } else if (daysUntil === 0) {
                        return <p className="text-xs text-amber-600 mt-1">Today!</p>
                      } else {
                        return <p className="text-xs text-muted-foreground mt-1">Past event</p>
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Overview - Show when proposal has been sent (Sent/PROPOSAL_SENT/contract_sent) but not yet Active */}
      {(booking.status === "PROPOSAL_SENT" || 
        booking.status === "contract_sent" || 
        booking.status === "Sent") && 
        booking.status !== "Active" &&
        booking.contract_text && (
        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Proposal Active
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your proposal has been generated and sent to your client. They can access it via the portal link below.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Client Portal Link:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs break-all bg-muted px-2 py-1 rounded">
                        {portalUrl}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPortalUrl}
                        className="shrink-0"
                      >
                        {portalUrlCopied ? (
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
                  {booking.contract_text && (() => {
                    // Strip HTML tags using regex (works on both client and server)
                    const stripHtml = (html: string) => {
                      return html
                        .replace(/<[^>]*>/g, '') // Remove HTML tags
                        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
                        .replace(/&amp;/g, '&') // Replace &amp; with &
                        .replace(/&lt;/g, '<') // Replace &lt; with <
                        .replace(/&gt;/g, '>') // Replace &gt; with >
                        .replace(/&quot;/g, '"') // Replace &quot; with "
                        .replace(/&#39;/g, "'") // Replace &#39; with '
                        .trim()
                    }
                    
                    const cleanText = stripHtml(booking.contract_text)
                    const previewLines = cleanText.split(/\n+/).filter(line => line.trim()).slice(0, 4)
                    const totalLines = cleanText.split(/\n+/).filter(line => line.trim()).length
                    const hasMore = totalLines > previewLines.length
                    
                    return (
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contract Preview</p>
                          <Badge variant="outline" className="text-xs">Preview</Badge>
                        </div>
                        <div className="space-y-2.5 max-h-40 overflow-y-auto pr-2">
                          {previewLines.map((line, idx) => (
                            <p 
                              key={idx}
                              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                              style={{ 
                                fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                                lineHeight: '1.7'
                              }}
                            >
                              {line.trim() || "\u00A0"}
                            </p>
                          ))}
                          {hasMore && (
                            <p className="text-xs text-muted-foreground italic pt-1 border-t border-gray-200 dark:border-gray-700 mt-2">
                              ... {totalLines - previewLines.length} more paragraph{totalLines - previewLines.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Cards - Prominent Display */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contract Status Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Check if contract is signed - use multiple fields for accuracy
              const isSigned = booking.contract_signed_at || 
                               (booking.contract_signed === true && (booking.client_signature_name || booking.contract_signed_by))
              
              // Check if contract exists
              const hasContract = !!booking.contract_text

              if (isSigned) {
                // Contract is signed
                const signedDate = booking.contract_signed_at 
                  ? new Date(booking.contract_signed_at)
                  : booking.updated_at 
                    ? new Date(booking.updated_at)
                    : null
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <Badge className="bg-green-600 hover:bg-green-700">Signed</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      {(booking.client_signature_name || booking.contract_signed_by) && (
                        <p>
                          <span className="font-medium">Signed by:</span> {booking.client_signature_name || booking.contract_signed_by}
                        </p>
                      )}
                      {signedDate && (
                        <p>
                          <span className="font-medium">Signed on:</span>{" "}
                          {format(signedDate, "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      )}
                      {booking.signature_ip_address && booking.signature_ip_address !== "Unknown" && (
                        <p className="text-xs text-muted-foreground font-mono">
                          IP: {booking.signature_ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                )
              } else if (hasContract) {
                // Contract exists but not signed yet
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-amber-600" />
                      <Badge className="bg-amber-600 hover:bg-amber-700">Awaiting Signature</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contract has been sent to the client and is pending their signature.
                    </p>
                  </div>
                )
              } else {
                // No contract generated yet
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-gray-400" />
                      <Badge variant="outline">No Contract</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contract has not been generated yet. Convert the inquiry to create a proposal.
                    </p>
                  </div>
                )
              }
            })()}
          </CardContent>
        </Card>

        {/* Payment Status Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <PaymentStatusBadge
                  paymentStatus={booking.payment_status}
                  eventDate={booking.event_date}
                  totalPrice={booking.total_price}
                  depositAmount={booking.deposit_amount}
                  paymentMilestones={booking.payment_milestones}
                />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Price:</span>
                  <span className="font-semibold">${booking.total_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-semibold text-green-600">${totalPaid.toLocaleString()}</span>
                </div>
                {balanceDue > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Balance Due:</span>
                    <span className="font-semibold text-red-600">${balanceDue.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Momentum Link Card */}
      <Card>
        <CardHeader>
          <CardTitle>Momentum Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs break-all bg-muted px-3 py-2 rounded">
              {portalUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPortalUrl}
              className="shrink-0"
            >
              {portalUrlCopied ? (
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
          <p className="text-xs text-muted-foreground mt-2">
            Send this link to your client to access their portal
          </p>
        </CardContent>
      </Card>

      {/* Booking Information */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Client</p>
              <p className="text-lg font-semibold">{client?.name}</p>
              <p className="text-sm text-muted-foreground">{client?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Service Type</p>
              <p className="text-lg font-semibold capitalize">{booking.service_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Event Date</p>
              <p className="text-lg font-semibold">
                {format(new Date(booking.event_date), "MMMM d, yyyy")}
              </p>
            </div>
            {booking.deposit_amount && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deposit Amount</p>
                <p className="text-lg font-semibold">${booking.deposit_amount.toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proposal Generation - Only show if not already sent */}
      {(booking.status !== "PROPOSAL_SENT" && 
        booking.status !== "contract_sent" && 
        booking.status !== "Sent" && 
        booking.status !== "Active" &&
        booking.status === "Inquiry") && (
        <GenerateProposalButton
          bookingId={bookingId}
          photographerId={booking.photographer_id}
          onProposalGenerated={setEmailTemplateData}
        />
      )}

      {/* Email Template, Custom Form, and Files */}
      {emailTemplateData ? (
        <div className="grid gap-6 md:grid-cols-3">
          <ProposalEmailTemplate
            clientName={emailTemplateData.clientName}
            photographerName={emailTemplateData.photographerName}
            serviceType={emailTemplateData.serviceType}
            portalUrl={emailTemplateData.portalUrl}
          />
          <CustomFormBuilder bookingId={bookingId} />
          <FileUpload bookingId={bookingId} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <CustomFormBuilder bookingId={bookingId} />
          <FileUpload bookingId={bookingId} />
        </div>
      )}

      {/* Inquiry Conversion Modal - Only allow opening for Inquiry status */}
      <InquiryConversionModal
        open={conversionModalOpen && booking.status === "Inquiry"}
        onOpenChange={(open) => {
          // Only allow opening if status is still Inquiry
          if (open && booking.status !== "Inquiry") {
            return
          }
          setConversionModalOpen(open)
        }}
        booking={booking}
        onConversionSuccess={handleConversionSuccess}
      />
    </div>
  )
}

