"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface BookingsFiltersProps {
  paymentStatus: string
  status: string
  serviceType: string
  searchQuery?: string
  onPaymentStatusChange: (value: string) => void
  onStatusChange: (value: string) => void
  onServiceTypeChange: (value: string) => void
  onSearchChange: (value: string) => void
}

export function BookingsFilters({
  paymentStatus,
  status,
  serviceType,
  searchQuery = "",
  onPaymentStatusChange,
  onStatusChange,
  onServiceTypeChange,
  onSearchChange,
}: BookingsFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchQuery, onSearchChange])

  return (
    <div className="flex flex-wrap gap-4">
      {/* Search Bar */}
      <div className="space-y-2 flex-1 min-w-[200px]">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            placeholder="Search by client name..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment-status-filter">Payment Status</Label>
        <Select
          id="payment-status-filter"
          value={paymentStatus}
          onChange={(e) => onPaymentStatusChange(e.target.value)}
        >
          <option value="all">All</option>
          <option value="PENDING_DEPOSIT">Pending Deposit</option>
          <option value="DEPOSIT_PAID">Deposit Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select
          id="status-filter"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="all">All</option>
          <option value="Inquiry">Inquiry</option>
          <option value="draft">Draft</option>
          <option value="contract_sent">Contract Sent</option>
          <option value="PROPOSAL_SENT">Proposal Sent</option>
          <option value="contract_signed">Contract Signed</option>
          <option value="payment_pending">Payment Pending</option>
          <option value="completed">Completed</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="service-type-filter">Service Type</Label>
        <Select
          id="service-type-filter"
          value={serviceType}
          onChange={(e) => onServiceTypeChange(e.target.value)}
        >
          <option value="all">All</option>
          <option value="wedding">Wedding</option>
          <option value="portrait">Portrait</option>
          <option value="event">Event</option>
        </Select>
      </div>
    </div>
  )
}

