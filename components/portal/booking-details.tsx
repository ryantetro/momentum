"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { MilestoneTracker } from "@/components/portal/milestone-tracker"
import type { Booking, Client, Photographer } from "@/types"
import { formatDateSafe } from "@/lib/utils"

interface BookingDetailsProps {
  booking: Booking
  client: Client
}

export function BookingDetails({ booking, client }: BookingDetailsProps) {
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const supabase = createClient()
  const capitalizedServiceType =
    booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)

  useEffect(() => {
    async function fetchPhotographer() {
      const { data } = await supabase
        .from("photographers")
        .select("*")
        .eq("id", booking.photographer_id)
        .single()

      if (data) {
        setPhotographer(data)
      }
    }

    fetchPhotographer()
  }, [booking.photographer_id, supabase])

  const photographerName =
    photographer?.business_name || photographer?.studio_name || photographer?.email || "Photographer"

  return (
    <div className="space-y-6">
      {/* Welcome Card - Enhanced */}
      <Card className="border border-stone-200 shadow-xl bg-gradient-to-br from-white to-stone-50 overflow-hidden">
        <CardContent className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Welcome Text */}
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-3">
                Welcome, {client.name}!
              </h2>
              <p className="text-lg md:text-xl text-stone-600 mb-4 leading-relaxed">
                Your proposal for your <strong className="font-semibold text-stone-900">{capitalizedServiceType}</strong> is ready for review.
              </p>

              {/* Service Details */}
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Service Type</p>
                  <p className="text-base font-semibold text-blue-900 capitalize">{booking.service_type}</p>
                </div>
                <div className="px-4 py-2 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Event Date</p>
                  <p className="text-base font-semibold text-purple-900">
                    {formatDateSafe(booking.event_date, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {/* Studio Logo (if available) */}
            {photographer?.logo_url && (
              <div className="flex-shrink-0">
                <Image
                  src={photographer.logo_url}
                  alt={`${photographerName} Logo`}
                  width={120}
                  height={120}
                  className="object-contain rounded-xl bg-white p-4 shadow-md border border-stone-200"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Milestone Tracker */}
      <MilestoneTracker booking={booking} />

      {/* Booking Details Card - Enhanced */}
      <Card className="border border-stone-200 shadow-lg bg-white">
        <CardContent className="p-6 md:p-8">
          <h3 className="text-xl font-semibold text-stone-900 mb-6">Booking Summary</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-sm font-medium text-stone-600 mb-2 uppercase tracking-wide">Total Amount</p>
              <p className="text-2xl font-bold text-stone-900">${booking.total_price.toLocaleString()}</p>
            </div>
            {booking.deposit_amount && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-600 mb-2 uppercase tracking-wide">Deposit Due</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${booking.deposit_amount.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



