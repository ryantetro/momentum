"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toaster"
import { createClient } from "@/lib/supabase/client"
import {
  Copy,
  Check,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  ExternalLink,
  ArrowRight,
  PenTool,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import type { Client, Booking } from "@/types"
import Link from "next/link"
import { formatDateSafe, parseDateSafe } from "@/lib/utils"

interface ClientWithBookings extends Client {
  bookings?: Booking[]
}

interface ClientDetailSlideoverProps {
  client: ClientWithBookings
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientUpdate?: () => void
}

function getClientStatus(bookings: Booking[] = []): "Inquiry" | "Active" | "Past" {
  const hasInquiry = bookings.some((b) => b.status === "Inquiry")
  const hasActive = bookings.some(
    (b) => b.status !== "completed" && b.status !== "Inquiry"
  )

  if (hasInquiry) return "Inquiry"
  if (hasActive) return "Active"
  return "Past"
}

function getTotalValue(bookings: Booking[] = []): number {
  return bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)
}

function getTotalPaid(bookings: Booking[] = []): number {
  return bookings.reduce((sum, booking) => {
    const paid = booking.payment_milestones
      ?.filter((m) => m.status === "paid")
      .reduce((milestoneSum, m) => milestoneSum + m.amount, 0) || 0
    return sum + paid
  }, 0)
}

// Generate initials from client name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Generate consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-emerald-500 to-emerald-600",
    "from-amber-500 to-amber-600",
    "from-indigo-500 to-indigo-600",
    "from-rose-500 to-rose-600",
    "from-teal-500 to-teal-600",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function ClientDetailSlideover({
  client,
  open,
  onOpenChange,
  onClientUpdate,
}: ClientDetailSlideoverProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [notes, setNotes] = useState(client.notes || "")
  const [savingNotes, setSavingNotes] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>(client.bookings || [])
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch fresh bookings data when slideover opens
  useEffect(() => {
    if (open && client.id) {
      async function fetchBookings() {
        try {
          const { data, error } = await supabase
            .from("bookings")
            .select("*")
            .eq("client_id", client.id)
            .order("created_at", { ascending: false })

          if (error) throw error
          setBookings(data || [])
        } catch (error) {
          console.error("Error fetching bookings:", error)
        }
      }
      fetchBookings()
    }
  }, [open, client.id, supabase])

  // Sync notes state when client changes
  useEffect(() => {
    setNotes(client.notes || "")
  }, [client.id, client.notes])

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast({
      title: "Copied",
      description: `${field} copied to clipboard`,
    })
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const { error } = await supabase
        .from("clients")
        .update({ notes })
        .eq("id", client.id)

      if (error) throw error

      toast({
        title: "Notes saved",
        description: "Your notes have been saved",
      })

      // Trigger parent refresh
      if (onClientUpdate) {
        onClientUpdate()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save notes",
        variant: "destructive",
      })
    } finally {
      setSavingNotes(false)
    }
  }

  const status = getClientStatus(bookings)
  const totalValue = getTotalValue(bookings)
  const totalPaid = getTotalPaid(bookings)

  // Build activity timeline
  const timeline: Array<{
    date: Date
    type: string
    description: string
    bookingId?: string
  }> = []

  bookings.forEach((booking) => {
    if (booking.created_at) {
      timeline.push({
        date: parseDateSafe(booking.created_at)!,
        type: booking.status === "Inquiry" ? "inquiry" : "booking",
        description:
          booking.status === "Inquiry"
            ? "Inquiry received"
            : `Booking created for ${booking.service_type}`,
        bookingId: booking.id,
      })
    }
    if (booking.contract_signed_at) {
      timeline.push({
        date: parseDateSafe(booking.contract_signed_at)!,
        type: "contract",
        description: "Contract signed",
        bookingId: booking.id,
      })
    }
    booking.payment_milestones?.forEach((milestone) => {
      if (milestone.paid_at) {
        timeline.push({
          date: parseDateSafe(milestone.paid_at)!,
          type: "payment",
          description: `Payment received: $${milestone.amount.toLocaleString()}`,
          bookingId: booking.id,
        })
      }
    })
  })

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Icon mapping for timeline
  const iconMap = {
    inquiry: Mail,
    contract: PenTool,
    payment: DollarSign,
    booking: Calendar,
  }

  const initials = getInitials(client.name)
  const avatarColor = getAvatarColor(client.name)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed right-0 top-0 h-full w-full max-w-2xl translate-x-0 translate-y-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right rounded-l-lg rounded-r-none border-r flex flex-col p-0">
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-semibold text-xl shadow-sm shrink-0`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-serif text-2xl font-bold text-stone-900 mb-1">
                {client.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : status === "Inquiry"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-stone-50 text-stone-700 border-stone-200"
                    }`}
                >
                  {status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Sticky Action Buttons */}
        <div className="sticky top-[88px] z-10 bg-background border-b px-6 py-4">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onOpenChange(false)
                router.push(`/bookings/new?clientId=${client.id}`)
              }}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = `mailto:${client.email}`
              }}
              className="flex-1"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-sans">{client.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(client.email, "Email")}
                    className="h-8 w-8 p-0"
                  >
                    {copiedField === "Email" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {client.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-sans">{client.phone}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(client.phone!, "Phone")}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === "Phone" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Summary - Grid Layout */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {/* Total Value */}
                  <div className="p-4 border border-stone-200 rounded-lg bg-white">
                    <p className="text-xs text-muted-foreground mb-2">Total Value</p>
                    <p className="text-lg font-semibold text-stone-900">
                      ${totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  {/* Total Paid */}
                  <div className="p-4 border border-stone-200 rounded-lg bg-white">
                    <p className="text-xs text-muted-foreground mb-2">Total Paid</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${totalPaid.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  {/* Outstanding */}
                  <div className="p-4 border border-stone-200 rounded-lg bg-white">
                    <p className="text-xs text-muted-foreground mb-2">Outstanding</p>
                    <p className="text-lg font-bold text-stone-900">
                      ${(totalValue - totalPaid).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline - Enhanced with Icons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                ) : (
                  <div className="space-y-6">
                    {timeline.map((item, index) => {
                      const IconComponent = iconMap[item.type as keyof typeof iconMap] || Calendar
                      const iconColorClass =
                        item.type === "inquiry"
                          ? "text-amber-600 bg-amber-50"
                          : item.type === "contract"
                            ? "text-green-600 bg-green-50"
                            : item.type === "payment"
                              ? "text-blue-600 bg-blue-50"
                              : "text-stone-600 bg-stone-50"

                      return (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full ${iconColorClass} flex items-center justify-center shrink-0`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            {index < timeline.length - 1 && (
                              <div className="w-px h-full bg-stone-200 min-h-[48px] mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <p className="text-sm font-medium text-stone-900">{item.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(item.date, { addSuffix: true })}
                            </p>
                            {item.bookingId && (
                              <Link
                                href={`/bookings/${item.bookingId}`}
                                className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-flex items-center gap-1 font-medium transition-colors"
                              >
                                View booking <ArrowRight className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookings yet</p>
                ) : (
                  <div className="space-y-2">
                    {bookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/bookings/${booking.id}`}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium capitalize font-sans">
                            {booking.service_type} - {formatDateSafe(booking.event_date)}
                          </p>
                          <p className="text-xs text-muted-foreground font-sans">
                            ${booking.total_price.toLocaleString()} • {booking.status}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder="Add notes about this client (e.g., preferences, special requests, etc.)"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-sans ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  disabled={savingNotes}
                />
                {savingNotes && (
                  <p className="text-xs text-muted-foreground mt-1 font-sans">Saving...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

