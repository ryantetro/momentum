"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookingsTable } from "@/components/bookings/bookings-table"
import { BookingsFilters } from "@/components/bookings/bookings-filters"
import { BookingsSort } from "@/components/bookings/bookings-sort"
import type { Booking } from "@/types"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const supabase = createClient()

  useEffect(() => {
    async function fetchBookings() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
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
          .eq("photographer_id", photographer.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setBookings(data || [])
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [supabase])

  // Apply filters and sorting
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = [...bookings]

    // Apply filters
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(
        (b) => b.payment_status === paymentStatusFilter
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter)
    }
    if (serviceTypeFilter !== "all") {
      filtered = filtered.filter((b) => b.service_type === serviceTypeFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortBy === "event_date") {
        aValue = new Date(a.event_date).getTime()
        bValue = new Date(b.event_date).getTime()
      } else if (sortBy === "created_at") {
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
      } else if (sortBy === "total_price") {
        aValue = typeof a.total_price === "number" ? a.total_price : parseFloat(a.total_price.toString())
        bValue = typeof b.total_price === "number" ? b.total_price : parseFloat(b.total_price.toString())
      } else {
        return 0
      }

      if (sortOrder === "asc") {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

    return filtered
  }, [
    bookings,
    paymentStatusFilter,
    statusFilter,
    serviceTypeFilter,
    sortBy,
    sortOrder,
  ])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-48 animate-pulse rounded bg-muted"></div>
          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted"></div>
        </div>
        <div className="h-96 animate-pulse rounded-lg border bg-muted"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          Manage all your bookings
        </p>
      </div>
      <div className="space-y-4">
        <BookingsFilters
          paymentStatus={paymentStatusFilter}
          status={statusFilter}
          serviceType={serviceTypeFilter}
          onPaymentStatusChange={setPaymentStatusFilter}
          onStatusChange={setStatusFilter}
          onServiceTypeChange={setServiceTypeFilter}
        />
        <BookingsSort
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
        />
      </div>
      <BookingsTable bookings={filteredAndSortedBookings} />
    </div>
  )
}

