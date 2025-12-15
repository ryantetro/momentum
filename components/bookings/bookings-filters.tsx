"use client"

import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

interface BookingsFiltersProps {
  paymentStatus: string
  status: string
  serviceType: string
  onPaymentStatusChange: (value: string) => void
  onStatusChange: (value: string) => void
  onServiceTypeChange: (value: string) => void
}

export function BookingsFilters({
  paymentStatus,
  status,
  serviceType,
  onPaymentStatusChange,
  onStatusChange,
  onServiceTypeChange,
}: BookingsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
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
          <option value="draft">Draft</option>
          <option value="contract_sent">Contract Sent</option>
          <option value="contract_signed">Contract Signed</option>
          <option value="payment_pending">Payment Pending</option>
          <option value="completed">Completed</option>
          <option value="PROPOSAL_SENT">Proposal Sent</option>
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
        </Select>
      </div>
    </div>
  )
}

