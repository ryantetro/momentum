"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/toaster"
import Link from "next/link"

export function BookingsEmptyState() {
  const { toast } = useToast()

  const handleImportCalendar = () => {
    toast({
      title: "Coming soon",
      description: "Calendar import feature is coming soon!",
    })
  }

  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No bookings yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        Create your first booking to start managing your shoots. Track contracts, payments, and client communications all in one place.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/bookings/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Booking
          </Button>
        </Link>
        <Button variant="outline" onClick={handleImportCalendar}>
          <Calendar className="mr-2 h-4 w-4" />
          Import from Calendar
        </Button>
      </div>
    </div>
  )
}

