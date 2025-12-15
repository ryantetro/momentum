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
import { ArrowLeft } from "lucide-react"
import type { Booking, Client } from "@/types"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
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
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Price</p>
              <p className="text-lg font-semibold">${booking.total_price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant="outline" className="mt-1">
                {booking.status.replace("_", " ")}
              </Badge>
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

      {booking.contract_signed_at && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Signed by:</span> {booking.client_signature_name || booking.contract_signed_by}
              </p>
              <p className="text-sm">
                <span className="font-medium">Signed on:</span>{" "}
                {format(new Date(booking.contract_signed_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <CustomFormBuilder bookingId={bookingId} />
        <FileUpload bookingId={bookingId} />
      </div>
    </div>
  )
}

