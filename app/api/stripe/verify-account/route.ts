import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"

export async function GET(request: NextRequest) {
  try {
    // Try to get access token from Authorization header first
    const authHeader = request.headers.get("authorization")
    let user = null
    let authError = null
    let supabase = await createClient()

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      
      // Validate token using Supabase REST API directly
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
        })

        if (response.ok) {
          const userData = await response.json()
          user = userData
          
          // Create a client with the token for database operations
          const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
          supabase = createSupabaseClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            }
          )
        } else {
          const errorData = await response.json()
          authError = new Error(errorData.message || 'Token validation failed')
        }
      } catch (fetchError: any) {
        authError = fetchError
      }
    }

    // If token auth didn't work, try cookie-based auth
    if (!user) {
      const {
        data: { user: cookieUser },
        error: cookieError,
      } = await supabase.auth.getUser()

      user = cookieUser
      authError = cookieError
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message || "No user found" },
        { status: 401 }
      )
    }

    // Get photographer record
    const { data: photographer, error: photographerError } = await supabase
      .from("photographers")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: "Photographer not found" },
        { status: 404 }
      )
    }

    if (!photographer.stripe_account_id) {
      return NextResponse.json(
        { 
          error: "No Stripe account found",
          charges_enabled: false,
          details_submitted: false,
        },
        { status: 404 }
      )
    }

    // Retrieve Stripe account to check status
    try {
      const account = await stripe.accounts.retrieve(photographer.stripe_account_id)

      // Extract requirements data
      const requirements = account.requirements || {}
      const pastDue = requirements.past_due || []
      const currentlyDue = requirements.currently_due || []
      const eventuallyDue = requirements.eventually_due || []
      const currentDeadline = requirements.current_deadline || null
      const errors = requirements.errors || []

      // Log account status for debugging
      console.log("Stripe account status:", {
        account_id: account.id,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        livemode: account.livemode,
        type: account.type,
        past_due_count: pastDue.length,
        currently_due_count: currentlyDue.length,
      })

      return NextResponse.json({
        charges_enabled: account.charges_enabled || false,
        details_submitted: account.details_submitted || false,
        account_id: account.id,
        payouts_enabled: account.payouts_enabled || false,
        livemode: account.livemode || false,
        requirements: {
          past_due: pastDue,
          currently_due: currentlyDue,
          eventually_due: eventuallyDue,
          current_deadline: currentDeadline,
          errors: errors,
        },
      })
    } catch (stripeError: any) {
      console.error("Error retrieving Stripe account:", stripeError)
      
      // If account doesn't exist or wrong mode, return appropriate error
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json(
          { 
            error: "Stripe account not found",
            charges_enabled: false,
            details_submitted: false,
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          error: stripeError.message || "Failed to verify Stripe account",
          charges_enabled: false,
          details_submitted: false,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error verifying Stripe account:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify account" },
      { status: 500 }
    )
  }
}

