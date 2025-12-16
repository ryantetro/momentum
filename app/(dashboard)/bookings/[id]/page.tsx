"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GenerateProposalButton } from "@/components/bookings/generate-proposal-button"
import { CustomFormBuilder } from "@/components/bookings/custom-form-builder"
import { FileUpload } from "@/components/bookings/file-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle, DollarSign, FileText, Copy, Check } from "lucide-react"
import type { Booking, Client } from "@/types"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalUrlCopied, setPortalUrlCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchBooking() {
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
      } catch (error) {
        console.error("Error fetching booking:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId, supabase, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!booking) {
    return <div>Booking not found</div>
  }

  const client = booking.client as Client
  const [portalUrlCopied, setPortalUrlCopied] = useState(false)

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

  // Get payment status badge
  const getPaymentStatusBadge = () => {
    if (booking.payment_status === "paid") {
      return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>
    } else if (booking.payment_status === "DEPOSIT_PAID") {
      return <Badge className="bg-blue-600 hover:bg-blue-700">Deposit Paid</Badge>
    } else if (booking.payment_status === "partial") {
      return <Badge className="bg-amber-600 hover:bg-amber-700">Balance Due</Badge>
    } else {
      return <Badge className="bg-red-600 hover:bg-red-700">Payment Pending</Badge>
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
      </div>

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
            {booking.contract_signed_at ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <Badge className="bg-green-600 hover:bg-green-700">Signed</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Signed by:</span> {booking.client_signature_name || booking.contract_signed_by}
                  </p>
                  <p>
                    <span className="font-medium">Signed on:</span>{" "}
                    {format(new Date(booking.contract_signed_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                  {booking.signature_ip_address && booking.signature_ip_address !== "Unknown" && (
                    <p className="text-xs text-muted-foreground font-mono">
                      IP: {booking.signature_ip_address}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <Badge variant="destructive">Unsigned</Badge>
              </div>
            )}
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
              <div>{getPaymentStatusBadge()}</div>
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

      {/* Booking Information and Proposal Generation */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <GenerateProposalButton
          bookingId={bookingId}
          photographerId={booking.photographer_id}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CustomFormBuilder bookingId={bookingId} />
        <FileUpload bookingId={bookingId} />
      </div>
    </div>
  )
}

