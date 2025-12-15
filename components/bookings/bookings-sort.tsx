"use client"

import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

interface BookingsSortProps {
  sortBy: string
  sortOrder: "asc" | "desc"
  onSortByChange: (value: string) => void
  onSortOrderChange: (value: "asc" | "desc") => void
}

export function BookingsSort({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: BookingsSortProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-2">
        <Label htmlFor="sort-by">Sort By</Label>
        <Select
          id="sort-by"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
        >
          <option value="event_date">Event Date</option>
          <option value="created_at">Created Date</option>
          <option value="total_price">Total Price</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sort-order">Order</Label>
        <Select
          id="sort-order"
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value as "asc" | "desc")}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </Select>
      </div>
    </div>
  )
}

