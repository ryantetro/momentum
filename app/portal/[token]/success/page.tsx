"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PortalHeader } from "@/components/portal/portal-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Download, FileText, Calendar, Mail, Clock } from "lucide-react"
import { motion } from "framer-motion"
import Confetti from "react-confetti"
import { format } from "date-fns"
import type { Booking, Client } from "@/types"
import { parseDateSafe, formatDateSafe } from "@/lib/utils"
import { marked } from "marked"

// Configure marked
marked.use({
  gfm: true,
  breaks: true,
})

export default function SuccessPage() {
  const params = useParams()
  const token = params.token as string
  const [booking, setBooking] = useState<Booking | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [photographer, setPhotographer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const supabase = createClient()

  useEffect(() => {
    // Set window size for confetti
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*, clients(*)")
          .eq("portal_token", token)
          .single()

        if (bookingError) throw bookingError

        if (bookingData) {
          setBooking(bookingData)
          setClient(bookingData.clients as Client)

          // Fetch photographer data
          const { data: photographerData } = await supabase
            .from("photographers")
            .select("business_name, studio_name, email, first_name, last_name")
            .eq("id", bookingData.photographer_id)
            .single()

          if (photographerData) {
            setPhotographer(photographerData)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token, supabase])



  const handleDownloadContract = () => {
    if (!booking?.contract_text || !client) return

    // 1. Prepare Content with Variable Replacement
    let contractText = booking.contract_text

    // Helper for safe replacement
    const replace = (pattern: RegExp, value: string | null | undefined) => {
      contractText = contractText.replace(pattern, value || "_________________")
    }

    // Photographer Details
    const photogName = photographer?.business_name ||
      (photographer?.first_name ? `${photographer.first_name} ${photographer.last_name}` : "Photographer")

    replace(/\{\{photographer_name\}\}/g, photogName)
    replace(/\{\{photographer_email\}\}/g, photographer?.email)
    replace(/\{\{photographer_phone\}\}/g, photographer?.phone)
    replace(/\{\{photographer_address\}\}/g, "_________________")

    // Client Details
    replace(/\{\{client_name\}\}/g, client.name)
    replace(/\{\{client_email\}\}/g, client.email)
    replace(/\{\{client_phone\}\}/g, client.phone)
    replace(/\{\{client_address\}\}/g, "_________________")

    // Event/Booking Details
    replace(/\{\{event_date\}\}/g, formatDateSafe(booking.event_date, "MMMM d, yyyy"))
    replace(/\{\{agreement_date\}\}/g, formatDateSafe(booking.created_at, "MMMM d, yyyy"))
    replace(/\{\{total_price\}\}/g, `$${booking.total_price.toLocaleString()}`)
    replace(/\{\{service_type\}\}/g, booking.service_type)

    // Strip triple backticks if present
    if (contractText.trim().startsWith("```")) {
      contractText = contractText.trim().replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "")
    }

    // 2. Convert to HTML
    let htmlContent = ""
    try {
      htmlContent = marked.parse(contractText) as string
    } catch (e) {
      console.error("Markdown parse error", e)
      htmlContent = contractText // Fallback
    }

    // 3. Open Print Window
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Signed Contract - ${client.name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
              color: #1a1a1a;
            }
            h1, h2, h3 {
              font-weight: 700;
              margin-top: 24px;
              margin-bottom: 12px;
            }
            p { margin-bottom: 12px; }
            ul { margin-left: 20px; margin-bottom: 12px; }
            .signature-block {
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid #000;
                page-break-inside: avoid;
            }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          
          <div class="signature-block">
            <h3>Digitally Signed</h3>
            <p><strong>Signed by:</strong> ${booking.client_signature_name || client.name}</p>
            <p><strong>Date:</strong> ${formatDateSafe(booking.contract_signed_at, "MMMM d, yyyy 'at' h:mm a")}</p>
            ${booking.signature_ip_address ? `<p><strong>IP Address:</strong> ${booking.signature_ip_address}</p>` : ''}
            <p style="font-size: 0.8em; color: #666; margin-top: 10px;">
                This document was electronically signed via Momentum.
            </p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const photographerName =
    photographer?.business_name ||
    photographer?.studio_name ||
    (photographer?.first_name && photographer?.last_name
      ? `${photographer.first_name} ${photographer.last_name}`
      : photographer?.email || "Your Photographer")

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

  const eventDate = parseDateSafe(booking.event_date)!
  const signedDate = parseDateSafe(booking.contract_signed_at)

  // Determine if this is a final payment or deposit
  const isFullyPaid = booking.payment_status === "paid"
  const isDepositPaid = booking.payment_status === "DEPOSIT_PAID"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.1}
        />
      )}

      <PortalHeader photographerId={booking.photographer_id} />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isFullyPaid ? "You're All Set!" : "You're Officially Booked!"}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {isFullyPaid
                ? "Your payment is complete! Everything is confirmed and we're ready for your big day."
                : "Your deposit payment has been received and your date is now secured. We're so excited to work with you!"}
            </p>
          </motion.div>

          {/* What Happens Next Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border border-stone-200 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">What Happens Next</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Payment Confirmed */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {isFullyPaid ? "Payment Complete" : "Deposit Confirmed"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isFullyPaid
                        ? "Your full payment has been received. You're all set and ready for your event!"
                        : "Your payment was successful and your date is secured. You'll receive a confirmation email shortly."}
                    </p>
                  </div>
                </div>

                {/* Step 2: Prep Guide */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {isFullyPaid ? "Event Details" : "Prep Guide"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isFullyPaid
                        ? `${photographerName} will send you final event details and any last-minute reminders as your date approaches.`
                        : `Keep an eye on your inbox; ${photographerName} will send you a session guide and preparation tips within 48 hours.`}
                    </p>
                  </div>
                </div>

                {/* Step 3: The Big Day */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                      <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">The Big Day</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      See you on <strong>{formatDateSafe(booking.event_date, "MMMM d, yyyy")}</strong>! We can't
                      wait to capture your special moments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Document Hub */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border border-stone-200 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Your Documents</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Download your signed contract and payment receipt for your records.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    onClick={handleDownloadContract}
                    variant="outline"
                    className="w-full h-auto py-6 flex flex-col items-center gap-2"
                    disabled={!booking.contract_text}
                  >
                    <FileText className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">Download Signed Contract</div>
                      <div className="text-xs text-muted-foreground">PDF Document</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-auto py-6 flex flex-col items-center gap-2"
                    disabled
                  >
                    <Download className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-semibold">View Receipt</div>
                      <div className="text-xs text-muted-foreground">Coming Soon</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Booking Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="border border-stone-200 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Date:</span>
                  <span className="font-semibold">{formatDateSafe(booking.event_date, "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Type:</span>
                  <span className="font-semibold capitalize">{booking.service_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Price:</span>
                  <span className="font-semibold">${booking.total_price.toLocaleString()}</span>
                </div>
                {isFullyPaid ? (
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-semibold text-green-600">
                      ${booking.total_price.toLocaleString()}
                    </span>
                  </div>
                ) : booking.deposit_amount ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit Paid:</span>
                    <span className="font-semibold text-green-600">
                      ${booking.deposit_amount.toLocaleString()}
                    </span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>

          {/* Legal Footer */}
          {signedDate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="pt-6 border-t border-gray-200"
            >
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  <strong>Contract Signed:</strong>{" "}
                  {booking.client_signature_name || "Client"} on{" "}
                  {formatDateSafe(booking.contract_signed_at, "MMMM d, yyyy 'at' h:mm a")}
                </p>
                {booking.signature_ip_address && booking.signature_ip_address !== "Unknown" && (
                  <p className="text-xs text-muted-foreground font-mono">
                    IP Address: {booking.signature_ip_address}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  This electronic signature has the same legal effect as a handwritten signature.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
