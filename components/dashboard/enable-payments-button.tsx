"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toaster"
import { createClient } from "@/lib/supabase/client"

export function EnablePaymentsButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleEnablePayments = async () => {
    setLoading(true)

    try {
      // Get session token from client-side Supabase
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error("Please log in to enable payments")
      }

      const response = await fetch("/api/stripe/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass the access token in Authorization header as fallback
          "Authorization": `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to enable payments")
      }

      // Redirect to Stripe onboarding
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No onboarding URL received")
      }
    } catch (error: any) {
      console.error("Error enabling payments:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to enable payments. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleEnablePayments}
      disabled={loading}
      size="lg"
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Enable Payments
        </>
      )}
    </Button>
  )
}

