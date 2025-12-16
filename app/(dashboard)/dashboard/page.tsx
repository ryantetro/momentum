import { createClient } from "@/lib/supabase/server"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { EnablePaymentsButton } from "@/components/dashboard/enable-payments-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Allow viewing dashboard without auth (for development/testing)
  // Show empty data if not authenticated
  let totalClients = 0
  let totalBookings = 0
  let pendingPayments = 0
  let bookings: any[] = []

  if (session) {
    // Get photographer ID
    const { data: photographer } = await supabase
      .from("photographers")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (photographer) {
      // Fetch stats
      const [clientsResult, bookingsResult] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact" }).eq("photographer_id", photographer.id),
        supabase
          .from("bookings")
          .select("*, clients(*)")
          .eq("photographer_id", photographer.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ])

      totalClients = clientsResult.count || 0
      bookings = bookingsResult.data || []
      totalBookings = bookings.length

      // Calculate pending payments
      pendingPayments = bookings.reduce((sum, booking) => {
        if (booking.payment_status !== "paid") {
          const paidAmount = booking.payment_milestones?.reduce(
            (paid: number, milestone: any) => (milestone.status === "paid" ? paid + milestone.amount : paid),
            0
          ) || 0
          return sum + (booking.total_price - paidAmount)
        }
        return sum
      }, 0)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your photography business
        </p>
      </div>
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
      <StatsCards
        totalClients={totalClients}
        totalBookings={totalBookings}
        pendingPayments={pendingPayments}
      />
      <RecentActivity bookings={bookings} />
    </div>
  )
}

// Add error boundary component
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
    </div>
  )
}

