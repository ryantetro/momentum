"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { PortalHeader } from "@/components/portal/portal-header"
import { PortalHero } from "@/components/portal/portal-hero"
import { BookingDetails } from "@/components/portal/booking-details"
import { ContractViewer } from "@/components/portal/contract-viewer"
import { SignatureForm } from "@/components/portal/signature-form"
import { PaymentMilestones } from "@/components/portal/payment-milestones"
import { PaymentSection } from "@/components/portal/payment-section"
import { TimelineForm } from "@/components/portal/timeline-form"
import { CustomForm } from "@/components/portal/custom-form"
import { BookingFiles } from "@/components/portal/booking-files"
import { StickyActionFooter } from "@/components/portal/sticky-action-footer"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/toaster"
import Confetti from "react-confetti"
import type { Booking, Client, Photographer } from "@/types"

export default function PortalPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const [autoRedirecting, setAutoRedirecting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })
  const [signing, setSigning] = useState(false)
  const [paying, setPaying] = useState(false)
  const paymentSectionRef = useRef<HTMLDivElement>(null)
  const signatureFormRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  // Get window dimensions for confetti
  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // Check for payment success in URL
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setShowPaymentSuccess(true)
      // Hide success message after 5 seconds
      setTimeout(() => setShowPaymentSuccess(false), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchBooking() {
      try {
        console.log("Fetching booking with token:", token)

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Supabase environment variables not configured")
        }

        // Create a fresh client instance for this query (bypass singleton)
        console.log("Creating fresh Supabase client...")
        const freshClient = createSupabaseClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        })

        console.log("Querying bookings table...")
        const { data, error } = await freshClient
          .from("bookings")
          .select(`
            *,
            client:clients(*),
            contract_signed_at,
            contract_signed,
            client_signature_name,
            signature_ip_address,
            signature_user_agent
          `)
          .eq("portal_token", token)
          .single()

        console.log("Query completed. Has data:", !!data, "Has error:", !!error)

        if (error) {
          console.error("Error fetching booking:", error)
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          // Still set loading to false so user sees error message
          setLoading(false)
          return
        }

        if (!data) {
          console.error("No booking data returned for token:", token)
          setLoading(false)
          return
        }

        // Debug: Log signature data to verify it's being fetched
        console.log("Booking data fetched keys:", Object.keys(data))
        console.log("Booking data fetched:", {
          id: data.id,
          contract_signed_at: data.contract_signed_at,
          contract_signed: data.contract_signed,
          client_signature_name: data.client_signature_name,
          hasClients: !!data.clients,
          hasClient: !!data.client,
        })

        setBooking(data)

        // Handle clients data - it might be an array or object, and might be named 'client' or 'clients'
        const rawClientData = data.client || data.clients
        const clientData = Array.isArray(rawClientData) ? rawClientData[0] : rawClientData

        if (clientData) {
          setClient(clientData as Client)
        } else {
          console.error("No client data found for booking. This might be an RLS issue or missing relationship.")
          console.log("Available keys in data:", Object.keys(data))
          toast({
            title: "Data Access Error",
            description: "Some booking information could not be loaded. Please contact your photographer.",
            variant: "destructive",
          })
        }

        // Initialize isSigned from database
        setIsSigned(!!data.contract_signed_at)
        console.log("isSigned set to:", !!data.contract_signed_at)

        // Fetch photographer data for hero
        if (data.photographer_id) {
          console.log("Fetching photographer data with ID:", data.photographer_id)
          const { data: photographerData, error: photographerError } = await freshClient
            .from("photographers")
            .select("*")
            .eq("id", data.photographer_id)
            .single()

          if (photographerError) {
            console.error("Error fetching photographer:", photographerError)
          } else if (photographerData) {
            console.log("Photographer data fetched successfully")
            setPhotographer(photographerData)
          } else {
            console.error("No photographer data found. This might be an RLS issue.")
          }
        } else {
          console.log("No photographer_id found in booking data")
        }
      } catch (error: any) {
        console.error("Unexpected error fetching booking:", error)
        console.error("Error type:", typeof error)
        console.error("Error message:", error?.message)
        console.error("Error stack:", error?.stack)
        // Ensure loading is set to false even on unexpected errors
        setLoading(false)
      } finally {
        // Double-check loading is set to false
        setLoading(false)
        console.log("Finally block executed - loading set to false")
      }
    }

    if (token) {
      console.log("Token exists, starting fetch...")
      fetchBooking().catch((err) => {
        console.error("Fetch booking promise rejected:", err)
        setLoading(false)
      })
    } else {
      console.error("No token provided")
      setLoading(false)
    }
  }, [token, supabase])

  const handleContractSigned = () => {
    // Set signed state immediately for instant UI update
    setIsSigned(true)

    // Trigger confetti animation
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 5000)

    // Show success toast
    toast({
      title: "Contract signed successfully!",
      description: "Redirecting to payment in 2 seconds...",
    })

    // Refresh booking data in background
    async function refreshBooking() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) return

      const freshClient = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      })

      const { data } = await freshClient
        .from("bookings")
        .select("*, client:clients(*)")
        .eq("portal_token", token)
        .single()

      if (data) {
        setBooking(data)
      }
    }
    refreshBooking()

    // Auto-scroll to payment section after signature confirmation appears
    // Delay of 800ms allows the confirmation message to render first
    setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }, 800)

    // Auto-redirect to Stripe checkout after 2 seconds
    if (booking && booking.payment_status === "PENDING_DEPOSIT") {
      setAutoRedirecting(true)
      setTimeout(async () => {
        try {
          const depositAmount = booking.deposit_amount
            ? Number(booking.deposit_amount)
            : (typeof booking.total_price === 'number' ? booking.total_price : Number(booking.total_price)) * 0.2

          const response = await fetch("/api/stripe/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: booking.id,
              amount: depositAmount,
              type: "deposit",
            }),
          })

          const data = await response.json()

          if (response.ok && data.url) {
            window.location.href = data.url
          } else {
            // If auto-redirect fails, just show payment section
            setAutoRedirecting(false)
            toast({
              title: "Ready to pay",
              description: "Click the button below to proceed to payment.",
            })
          }
        } catch (error) {
          // If auto-redirect fails, just show payment section
          setAutoRedirecting(false)
          toast({
            title: "Ready to pay",
            description: "Click the button below to proceed to payment.",
          })
        }
      }, 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!booking || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking Not Found</h1>
          <p className="text-muted-foreground">
            The booking link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  const handleStickySign = () => {
    signatureFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    // The form will handle its own submission when the user fills it out
    // This just scrolls to it
  }

  const handleStickyPay = async () => {
    if (!booking || paying) return
    setPaying(true)
    try {
      const depositAmount = booking.deposit_amount
        ? Number(booking.deposit_amount)
        : (typeof booking.total_price === 'number' ? booking.total_price : Number(booking.total_price)) * 0.2

      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          type: "deposit",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}
      <PortalHeader photographerId={booking.photographer_id} />

      {/* Hero Section with Progress Indicator */}
      {booking && client && photographer && (
        <PortalHero
          client={client}
          booking={booking}
          photographer={photographer}
          isSigned={isSigned}
        />
      )}

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">

          {/* Payment Success Message */}
          {showPaymentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border border-stone-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                      Booking Confirmed!
                    </h2>
                  </div>
                  <p className="text-green-700 dark:text-green-300">
                    Your deposit payment has been received. Your date is now officially secured!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Booking Details - Only show summary, hero is now separate */}
          {booking && client && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <BookingDetails booking={booking} client={client} />
            </motion.div>
          )}

          {/* Contract Viewer - Always show if contract exists */}
          {booking.contract_text && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ContractViewer booking={booking} client={client} />
            </motion.div>
          )}

          {/* Signature Form - Only show if NOT signed (local state OR database) */}
          {!isSigned && !booking.contract_signed_at && booking.contract_text && (
            <motion.div
              ref={signatureFormRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <SignatureForm bookingId={booking.id} onSuccess={handleContractSigned} />
            </motion.div>
          )}

          {/* No Contract Message */}
          {!booking.contract_text && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border border-stone-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Contract proposal has not been sent yet. Please contact your photographer.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Signed Confirmation - Show if signed (local state OR database) */}
          {(isSigned || booking.contract_signed_at) && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="rounded-lg border border-stone-200 shadow-sm bg-green-50/80 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="font-semibold text-green-800 text-lg">
                      Contract Signed Successfully!
                    </p>
                  </div>
                  <p className="text-sm text-green-700 text-center">
                    {booking.contract_signed_at
                      ? `Signed on ${new Date(booking.contract_signed_at).toLocaleDateString()}`
                      : "Signature confirmed"}
                  </p>
                  {(booking.client_signature_name || (client && client.name)) && (
                    <p className="text-sm text-green-700 text-center mt-1">
                      Signed by: {booking.client_signature_name || client?.name}
                    </p>
                  )}
                  {autoRedirecting && (
                    <div className="mt-4 p-3 bg-white rounded border border-green-200">
                      <p className="text-sm text-green-800 text-center">
                        Redirecting to secure payment in a moment...
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Payment Section - Show if signed and payment pending */}
              {(isSigned || booking.contract_signed_at) && booking.payment_status === "PENDING_DEPOSIT" && (
                <motion.div
                  ref={paymentSectionRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="scroll-mt-8"
                >
                  <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg
                          className="h-6 w-6 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-blue-900 dark:text-blue-100 mb-1">
                          Final Step: Secure Your Date
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {autoRedirecting
                            ? "Preparing secure checkout..."
                            : "Complete your deposit payment to officially book your event on the calendar."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div ref={paymentSectionRef}>
                    <PaymentSection booking={booking} />
                  </div>
                </motion.div>
              )}

              {/* Other Payment Statuses */}
              {(isSigned || booking.contract_signed_at) && booking.payment_status !== "PENDING_DEPOSIT" && booking.payment_status !== "DEPOSIT_PAID" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <PaymentMilestones booking={booking} />
                </motion.div>
              )}

              {(isSigned || booking.contract_signed_at) && booking.payment_status === "DEPOSIT_PAID" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="rounded-lg border border-stone-200 shadow-sm bg-blue-50/80 backdrop-blur-sm p-6 text-center">
                    <p className="font-semibold text-blue-800">
                      ✓ Deposit Payment Received
                    </p>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <TimelineForm bookingId={booking.id} />
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Sticky Action Footer for Mobile */}
      {booking && (
        <StickyActionFooter
          booking={booking}
          isSigned={isSigned}
          onSignClick={handleStickySign}
          onPayClick={handleStickyPay}
          signing={signing}
          paying={paying}
        />
      )}
    </div>
  )
}

