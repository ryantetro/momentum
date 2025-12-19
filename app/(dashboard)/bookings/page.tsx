"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookingsFilters } from "@/components/bookings/bookings-filters"
import { BookingsSort } from "@/components/bookings/bookings-sort"
import { BookingCard } from "@/components/bookings/booking-card"
import { BookingsEmptyState } from "@/components/bookings/bookings-empty-state"
import type { Booking } from "@/types"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
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
          .select(`
            *,
            clients (
              id,
              name,
              email,
              phone
            )
          `)
          .eq("photographer_id", photographer.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Transform data to normalize client relationship
        // Supabase returns clients as an array, but we want it as a single object
        const transformedBookings = (data || []).map((booking: any) => ({
          ...booking,
          client: Array.isArray(booking.clients) 
            ? booking.clients[0] 
            : booking.clients || booking.client,
        }))

        setBookings(transformedBookings)
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [supabase])

  // Apply filters, search, and sorting
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = [...bookings]

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter((booking) => {
        // Handle both array and object formats from Supabase
        const client = Array.isArray((booking as any).clients) 
          ? (booking as any).clients[0] 
          : Array.isArray(booking.client)
          ? booking.client[0]
          : booking.client || (booking as any).clients
        return client?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      })
    }

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

    // Sort inquiries first, then apply other sorting
    filtered.sort((a, b) => {
      // Always show inquiries first
      const aIsInquiry = a.status === "Inquiry"
      const bIsInquiry = b.status === "Inquiry"
      
      if (aIsInquiry && !bIsInquiry) return -1
      if (!aIsInquiry && bIsInquiry) return 1
      
      // If both are inquiries or both are not, apply normal sorting
      let aValue: any
      let bValue: any

      if (sortBy === "event_date") {
        aValue = new Date(a.event_date).getTime()
        bValue = new Date(b.event_date).getTime()
      } else if (sortBy === "created_at") {
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
      } else if (sortBy === "total_price") {
        aValue = a.total_price
        bValue = b.total_price
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
    searchQuery,
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
          searchQuery={searchQuery}
          onPaymentStatusChange={setPaymentStatusFilter}
          onStatusChange={setStatusFilter}
          onServiceTypeChange={setServiceTypeFilter}
          onSearchChange={setSearchQuery}
        />
        <BookingsSort
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
        />
      </div>

      {/* Card Grid or Empty State */}
      {filteredAndSortedBookings.length === 0 ? (
        <BookingsEmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}

