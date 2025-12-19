"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { ActionRequired } from "@/components/dashboard/action-required"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { EnablePaymentsButton } from "@/components/dashboard/enable-payments-button"
import { OverdueTasks } from "@/components/dashboard/overdue-tasks"
import { MomentumLaunchpad } from "@/components/dashboard/momentum-launchpad"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import Confetti from "react-confetti"
import type { Booking, Client } from "@/types"

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  
  // State for dashboard data
  const [totalClients, setTotalClients] = useState(0)
  const [totalBookings, setTotalBookings] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)
  const [projectedRevenue, setProjectedRevenue] = useState(0)
  const [overdueRevenue, setOverdueRevenue] = useState(0)
  const [bookings, setBookings] = useState<(Booking & { client?: Client })[]>([])
  const [inquiries, setInquiries] = useState<(Booking & { client?: Client })[]>([])
  const [overdueBookings, setOverdueBookings] = useState<(Booking & { client?: Client })[]>([])
  const [launchpadData, setLaunchpadData] = useState({
    stripeConnected: false,
    contractSet: false,
    inquiryLinkShared: false,
    username: null as string | null,
  })
  const [stripeRequirements, setStripeRequirements] = useState<{
    past_due: string[]
    currently_due: string[]
    eventually_due: string[]
    current_deadline: number | null
    errors: any[]
  } | null>(null)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
  const {
    data: { session },
  } = await supabase.auth.getSession()

        if (!session) {
          if (process.env.NODE_ENV === 'development') {
            console.log("ℹ️ Dashboard: No session found, showing empty data")
          }
          setLoading(false)
          return
        }

        setHasSession(true)

        // Get photographer data including launchpad checks
        const { data: photographer, error: photographerError } = await supabase
      .from("photographers")
          .select("id, stripe_account_id, contract_template, username")
      .eq("user_id", session.user.id)
      .single()

        if (photographerError) {
          console.error("❌ Dashboard: Photographer lookup error:", {
            error: photographerError,
            user_id: session.user.id,
            message: photographerError.message,
            code: photographerError.code,
          })
          setLoading(false)
          return
        }

        if (!photographer) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("⚠️ Dashboard: Photographer not found for user:", session.user.id)
          }
          setLoading(false)
          return
        }

        if (process.env.NODE_ENV === 'development') {
          console.log("✅ Dashboard: Photographer found:", {
            id: photographer.id,
            has_stripe: !!photographer.stripe_account_id,
            has_contract: !!photographer.contract_template,
            username: photographer.username,
          })
        }

        // Fetch all bookings (not just limit 10) for comprehensive stats
      const [clientsResult, bookingsResult] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact" }).eq("photographer_id", photographer.id),
        supabase
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
            .order("created_at", { ascending: false }),
        ])

        // Check for errors in clients query
        if (clientsResult.error) {
          console.error("❌ Dashboard: Clients query error:", {
            error: clientsResult.error,
            photographer_id: photographer.id,
            message: clientsResult.error.message,
            code: clientsResult.error.code,
          })
          setTotalClients(0)
        } else {
          setTotalClients(clientsResult.count ?? 0)
          if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Dashboard: Total clients: ${clientsResult.count ?? 0}`)
          }
        }

        // Check for errors in bookings query
        if (bookingsResult.error) {
          console.error("❌ Dashboard: Bookings query error:", {
            error: bookingsResult.error,
            photographer_id: photographer.id,
            message: bookingsResult.error.message,
            code: bookingsResult.error.code,
          })
          setBookings([])
          setTotalBookings(0)
        } else {
          // Transform data to normalize client relationship
          // Supabase returns clients as an array, but we want it as a single object
          const rawBookings = bookingsResult.data ?? []
          const transformedBookings = rawBookings.map((booking: any) => ({
            ...booking,
            client: Array.isArray(booking.clients) 
              ? booking.clients[0] 
              : booking.clients || booking.client,
          }))
          
          setBookings(transformedBookings)
          setTotalBookings(transformedBookings.length)
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Dashboard: Total bookings: ${transformedBookings.length}`)
          }

          // Debug: Log booking data for troubleshooting
          if (process.env.NODE_ENV === 'development' && transformedBookings.length > 0) {
            console.log('📊 Dashboard Stats Debug:')
            console.log(`Total bookings: ${transformedBookings.length}`)
            transformedBookings.forEach((b, i) => {
              console.log(`Booking ${i + 1}:`, {
                id: b.id?.substring(0, 8),
                status: b.status,
                payment_status: b.payment_status,
                contract_signed: b.contract_signed,
                total_price: b.total_price,
                deposit_amount: b.deposit_amount,
                event_date: b.event_date,
                has_milestones: !!b.payment_milestones,
              })
            })
          }

          // Calculate pending payments (outstanding amount across all bookings)
          // Only calculate if we have bookings data
          if (transformedBookings.length > 0) {
            const pending = transformedBookings.reduce((sum, booking) => {
              // Skip fully paid bookings
              if (booking.payment_status === "paid") {
                return sum
              }

              const totalPrice = Number(booking.total_price) || 0
              
              // Skip bookings with no price
              if (totalPrice === 0) {
                return sum
              }
              
              // Calculate total amount paid so far
              let paidAmount = 0
              
              // If deposit has been paid, add it to paid amount
              if (booking.payment_status === "DEPOSIT_PAID" && booking.deposit_amount) {
                paidAmount += Number(booking.deposit_amount)
              }
              
              // Parse payment_milestones if it's a string (JSON from database)
              let milestones = booking.payment_milestones
              if (typeof milestones === 'string') {
                try {
                  milestones = JSON.parse(milestones)
                } catch (e) {
                  milestones = []
                }
              }
              
              // Add up all paid milestones
              if (milestones && Array.isArray(milestones)) {
                const milestonePaid = milestones.reduce(
                  (paid: number, milestone: any) => {
                    if (milestone.status === "paid" && milestone.amount) {
                      return paid + Number(milestone.amount)
                    }
                    return paid
                  },
                  0
                )
                paidAmount += milestonePaid
              }
              
              // Calculate remaining balance
              const remaining = totalPrice - paidAmount
              
              // Only add positive remaining amounts (some edge cases might have overpayments)
              return sum + Math.max(0, remaining)
            }, 0)
            setPendingPayments(pending)
          }

          // Calculate projected revenue (next 30 days)
          // Only include bookings with signed contracts where balance_due > 0
          // Only calculate if we have bookings data
          if (transformedBookings.length > 0) {
            const now = new Date()
            now.setHours(0, 0, 0, 0) // Start of today
            const next30Days = new Date()
            next30Days.setDate(next30Days.getDate() + 30)
            next30Days.setHours(23, 59, 59, 999) // End of day 30

            const projected = transformedBookings.reduce((sum, booking) => {
              // Must have an event date and total price
              if (!booking.event_date || !booking.total_price) {
                return sum
              }

              const eventDate = new Date(booking.event_date)
              eventDate.setHours(0, 0, 0, 0)
              
              // Only include future events (within next 30 days)
              // Exclude past events (those go to overdue revenue)
              const isInNext30Days = eventDate >= now && eventDate <= next30Days
              
              if (!isInNext30Days) {
                return sum
              }
              
              // Include bookings that are confirmed (contract signed OR Active status)
              const isConfirmed = 
                booking.contract_signed === true ||
                booking.status === "Active" ||
                booking.status === "contract_signed"
              
              if (!isConfirmed) {
                return sum
              }
              
              // Calculate balance due (total_price - amount_paid)
              const totalPrice = Number(booking.total_price) || 0
              
              // Calculate total amount paid so far
              let paidAmount = 0
              
              // If deposit has been paid, add it to paid amount
              if (booking.payment_status === "DEPOSIT_PAID" && booking.deposit_amount) {
                paidAmount += Number(booking.deposit_amount)
              }
              
              // Parse payment_milestones if it's a string (JSON from database)
              let milestones = booking.payment_milestones
              if (typeof milestones === 'string') {
                try {
                  milestones = JSON.parse(milestones)
                } catch (e) {
                  milestones = []
                }
              }
              
              // Add up all paid milestones
              if (milestones && Array.isArray(milestones)) {
                const milestonePaid = milestones.reduce(
                  (paid: number, milestone: any) => {
                    if (milestone.status === "paid" && milestone.amount) {
                      return paid + Number(milestone.amount)
                    }
                    return paid
                  },
                  0
                )
                paidAmount += milestonePaid
              }
              
              // Calculate remaining balance
              const balanceDue = totalPrice - paidAmount
              
              // Only include if there's a balance due
              if (balanceDue > 0) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`✅ Including booking ${booking.id?.substring(0, 8)} in projected revenue: $${balanceDue} (balance due)`)
                }
                return sum + balanceDue
              }
              
              return sum
            }, 0)
            setProjectedRevenue(projected)
          }

          // Calculate overdue revenue (past events with unpaid balances)
          if (transformedBookings.length > 0) {
            const now = new Date()
            now.setHours(0, 0, 0, 0) // Start of today

            const overdue = transformedBookings.reduce((sum, booking) => {
              // Must have an event date and total price
              if (!booking.event_date || !booking.total_price) {
                return sum
              }

              const eventDate = new Date(booking.event_date)
              eventDate.setHours(0, 0, 0, 0)
              
              // Only include past events
              const isPastEvent = eventDate < now
              
              if (!isPastEvent) {
                return sum
              }
              
              // Include bookings that are confirmed (contract signed OR Active status)
              const isConfirmed = 
                booking.contract_signed === true ||
                booking.status === "Active" ||
                booking.status === "contract_signed"
              
              if (!isConfirmed) {
                return sum
              }
              
              // Calculate balance due (total_price - amount_paid)
              const totalPrice = Number(booking.total_price) || 0
              
              // Calculate total amount paid so far
              let paidAmount = 0
              
              // If deposit has been paid, add it to paid amount
              if (booking.payment_status === "DEPOSIT_PAID" && booking.deposit_amount) {
                paidAmount += Number(booking.deposit_amount)
              }
              
              // Parse payment_milestones if it's a string (JSON from database)
              let milestones = booking.payment_milestones
              if (typeof milestones === 'string') {
                try {
                  milestones = JSON.parse(milestones)
                } catch (e) {
                  milestones = []
                }
              }
              
              // Add up all paid milestones
              if (milestones && Array.isArray(milestones)) {
                const milestonePaid = milestones.reduce(
                  (paid: number, milestone: any) => {
                    if (milestone.status === "paid" && milestone.amount) {
                      return paid + Number(milestone.amount)
                    }
                    return paid
                  },
                  0
                )
                paidAmount += milestonePaid
              }
              
              // Calculate remaining balance
              const balanceDue = totalPrice - paidAmount
              
              // Only include if there's a balance due
              if (balanceDue > 0) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`⚠️  Including booking ${booking.id?.substring(0, 8)} in overdue revenue: $${balanceDue} (past event with balance)`)
                }
                return sum + balanceDue
              }
              
        return sum
      }, 0)
            setOverdueRevenue(overdue)
          }

          // Debug: Log final calculations (after setting state)
          // Note: This will log after state updates, so values might be from previous render
          // The actual values are set via setState above

          // Get inquiries
          const inquiryList = transformedBookings.filter((b) => b.status === "Inquiry")
          setInquiries(inquiryList)

          // Prepare launchpad data
          setLaunchpadData({
            stripeConnected: !!photographer.stripe_account_id,
            contractSet: !!photographer.contract_template,
            inquiryLinkShared: inquiryList.length > 0,
            username: photographer.username,
          })

          // Fetch Stripe requirements if account exists
          if (photographer.stripe_account_id) {
            try {
              const { data: { session: stripeSession } } = await supabase.auth.getSession()
              if (stripeSession) {
                const verifyResponse = await fetch("/api/stripe/verify-account", {
                  headers: {
                    "Authorization": `Bearer ${stripeSession.access_token}`,
                  },
                })
                
                if (verifyResponse.ok) {
                  const verifyData = await verifyResponse.json()
                  if (verifyData.requirements) {
                    setStripeRequirements(verifyData.requirements)
                  }
                }
              }
            } catch (error) {
              console.error("Error fetching Stripe requirements:", error)
              // Don't fail the whole dashboard if requirements fetch fails
            }
          }

          // Get overdue bookings
          const nowDate = new Date()
          const overdue = transformedBookings.filter((booking) => {
            // Check if payment_status is overdue
            if (booking.payment_status === "overdue") return true

            // Check if payment_due_date is past
            if (booking.payment_due_date) {
              const dueDate = new Date(booking.payment_due_date)
              if (
                dueDate < nowDate &&
                booking.payment_status !== "paid" &&
                booking.payment_status !== "DEPOSIT_PAID"
              ) {
                return true
              }
            }

            return false
          })
          setOverdueBookings(overdue)
        }
      } catch (error) {
        console.error("❌ Dashboard: Unexpected error fetching data:", {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  // Handle Stripe onboarding return flow
  useEffect(() => {
    const status = searchParams.get("status")
    
    if (status === "success") {
      handleStripeReturn()
    } else if (status === "error") {
      toast({
        title: "Onboarding Error",
        description: "There was an issue completing your Stripe setup. Please try again.",
        variant: "destructive",
      })
      // Clean URL
      router.replace("/dashboard")
    }
  }, [searchParams, router, toast])

  // Set window size for confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      }
      
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  const handleStripeReturn = async () => {
    try {
      // Get session token for API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error("No session found for Stripe verification")
        router.replace("/dashboard")
        return
      }

      // Call verification API
      const response = await fetch("/api/stripe/verify-account", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle error cases
        if (data.error === "No Stripe account found") {
          toast({
            title: "Account Not Found",
            description: "We couldn't find your Stripe account. Please try connecting again.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Verification Failed",
            description: data.error || "Failed to verify your Stripe account. Please try again.",
            variant: "destructive",
          })
        }
        router.replace("/dashboard")
        return
      }

      // Log verification data for debugging
      console.log("Stripe account verification:", {
        charges_enabled: data.charges_enabled,
        details_submitted: data.details_submitted,
        payouts_enabled: data.payouts_enabled,
        account_id: data.account_id,
      })

      // Check account status
      // For test mode accounts, charges_enabled might be true immediately
      // For live mode, it might take time for verification
      if (data.charges_enabled === true) {
        // Success! Account is fully enabled
        console.log("✅ Stripe account fully enabled - showing success toast")
        setShowConfetti(true)
        
        toast({
          title: "🚀 Payments Enabled!",
          description: "Your studio is now ready to accept deposits. Start booking clients!",
        })

        // Hide confetti after 3 seconds
        setTimeout(() => {
          setShowConfetti(false)
        }, 3000)

        // Refresh dashboard data to update Launchpad
        const { data: photographer } = await supabase
          .from("photographers")
          .select("stripe_account_id, contract_template, username")
          .eq("user_id", session.user.id)
          .single()

        if (photographer) {
          setLaunchpadData((prev) => ({
            ...prev,
            stripeConnected: !!photographer.stripe_account_id,
          }))
        }
      } else if (data.details_submitted === true && data.charges_enabled === false) {
        // Almost there - details submitted but verification pending
        console.log("⚠️ Stripe account details submitted but charges not yet enabled")
        toast({
          title: "Almost There!",
          description: "Your Stripe account is being verified. We'll notify you once payments are fully enabled. This usually takes a few minutes.",
        })
      } else if (data.account_id) {
        // Account exists but onboarding incomplete
        console.log("⚠️ Stripe account exists but onboarding incomplete")
        toast({
          title: "Onboarding Incomplete",
          description: "Please complete all required steps in Stripe to enable payments.",
        })
      } else {
        // No account found (shouldn't happen if we got here, but handle it)
        console.log("❌ No Stripe account found")
        toast({
          title: "Account Not Found",
          description: "We couldn't find your Stripe account. Please try connecting again.",
          variant: "destructive",
        })
      }

      // Clean URL
      router.replace("/dashboard")
    } catch (error: any) {
      console.error("Error verifying Stripe account:", error)
      toast({
        title: "Error",
        description: "Failed to verify your Stripe account. Please try again.",
        variant: "destructive",
      })
      router.replace("/dashboard")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your photography business
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Confetti celebration */}
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your photography business
        </p>
      </div>
        <QuickActions />
      </div>

      {hasSession && (
        <MomentumLaunchpad
          stripeConnected={launchpadData.stripeConnected}
          contractSet={launchpadData.contractSet}
          inquiryLinkShared={launchpadData.inquiryLinkShared}
          username={launchpadData.username}
          stripeRequirements={stripeRequirements}
        />
      )}

      <ActionRequired inquiries={inquiries} overdueBookings={overdueBookings} />

      <OverdueTasks />

      {/* Only show Payment Processing card if Stripe is not connected */}
      {!launchpadData.stripeConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Processing</CardTitle>
            <CardDescription>
              Enable Stripe Connect to start accepting payments from your clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnablePaymentsButton />
          </CardContent>
        </Card>
      )}

      <StatsCards
        totalClients={totalClients}
        totalBookings={totalBookings}
        pendingPayments={pendingPayments}
        projectedRevenue={projectedRevenue}
        overdueRevenue={overdueRevenue}
      />

      <RecentActivity bookings={bookings} />
    </div>
  )
}
