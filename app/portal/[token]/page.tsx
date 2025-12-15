"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PortalHeader } from "@/components/portal/portal-header"
import { BookingDetails } from "@/components/portal/booking-details"
import { ContractViewer } from "@/components/portal/contract-viewer"
import { SignatureForm } from "@/components/portal/signature-form"
import { PaymentMilestones } from "@/components/portal/payment-milestones"
import { PaymentSection } from "@/components/portal/payment-section"
import { TimelineForm } from "@/components/portal/timeline-form"
import { CustomForm } from "@/components/portal/custom-form"
import { BookingFiles } from "@/components/portal/booking-files"
import { Card, CardContent } from "@/components/ui/card"
import type { Booking, Client } from "@/types"

export default function PortalPage() {
  const params = useParams()
  const token = params.token as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchBooking() {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*, clients(*)")
          .eq("portal_token", token)
          .single()

        if (error) throw error

        if (data) {
          setBooking(data)
          setClient(data.clients as Client)
        }
      } catch (error) {
        console.error("Error fetching booking:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [token, supabase])

  const handleContractSigned = () => {
    // Refresh booking data
    async function refreshBooking() {
      const { data } = await supabase
        .from("bookings")
        .select("*, clients(*)")
        .eq("portal_token", token)
        .single()

      if (data) {
        setBooking(data)
      }
    }
    refreshBooking()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!booking || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking Not Found</h1>
          <p className="text-muted-foreground">
            The booking link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader photographerId={booking.photographer_id} />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <BookingDetails booking={booking} client={client} />

          {!booking.contract_signed_at ? (
            <>
              {booking.contract_text && (
                <>
                  <ContractViewer booking={booking} client={client} />
                  <SignatureForm bookingId={booking.id} onSuccess={handleContractSigned} />
                </>
              )}
              {!booking.contract_text && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      Contract proposal has not been sent yet. Please contact your photographer.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              <div className="rounded-lg border bg-green-50 p-4 text-center">
                <p className="font-semibold text-green-800">
                  ✓ Contract Signed on {new Date(booking.contract_signed_at).toLocaleDateString()}
                </p>
                {booking.client_signature_name && (
                  <p className="text-sm text-green-700 mt-1">
                    Signed by: {booking.client_signature_name}
                  </p>
                )}
              </div>
              {booking.payment_status === "PENDING_DEPOSIT" && (
                <PaymentSection booking={booking} />
              )}
              {booking.payment_status !== "PENDING_DEPOSIT" && booking.payment_status !== "DEPOSIT_PAID" && (
                <PaymentMilestones booking={booking} />
              )}
              {booking.payment_status === "DEPOSIT_PAID" && (
                <div className="rounded-lg border bg-blue-50 p-4 text-center">
                  <p className="font-semibold text-blue-800">
                    ✓ Deposit Payment Received
                  </p>
                </div>
              )}
              <TimelineForm bookingId={booking.id} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

