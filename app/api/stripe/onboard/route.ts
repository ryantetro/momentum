import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"

interface OnboardRequestBody {
  type?: "account_onboarding" | "account_update"
}

export async function POST(request: NextRequest) {
  const body: OnboardRequestBody = await request.json().catch(() => ({}))
  const linkType = body.type || "account_onboarding"
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
          console.log("Token validated successfully, user ID:", user.id)

          // Create a client with the token for database operations
          const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
          supabase = createSupabaseClient(
            supabaseUrl!,
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
          console.log("Token validation failed:", errorData)
        }
      } catch (fetchError: any) {
        authError = fetchError
        console.log("Error validating token:", fetchError)
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
      console.error("Auth error details:", {
        error: authError,
        message: authError?.message,
        hasAuthHeader: !!authHeader,
        tokenLength: authHeader?.substring(7).length,
      })
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message || "No user found. Please ensure you are logged in." },
        { status: 401 }
      )
    }

    // Get photographer record for the logged-in user
    const { data: photographer, error: photographerError } = await supabase
      .from("photographers")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: "Photographer not found" },
        { status: 404 }
      )
    }

    // Check if photographer already has a Stripe account
    let accountId = photographer.stripe_account_id

    // Check if we're using test mode
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
    console.log("Stripe mode check:", { isTestMode, hasAccountId: !!accountId })

    // If we have an existing account, check if it matches the current mode
    if (accountId) {
      try {
        // Try to retrieve the account to check its mode
        const existingAccount = await stripe.accounts.retrieve(accountId) as any
        const accountIsLive = existingAccount.livemode
        console.log("Existing account mode:", { accountId, accountIsLive, isTestMode })

        // If mode mismatch, clear the old account ID
        if ((isTestMode && accountIsLive) || (!isTestMode && !accountIsLive)) {
          console.log(`⚠️  Mode mismatch detected! Clearing old ${accountIsLive ? 'live' : 'test'} account to create new ${isTestMode ? 'test' : 'live'} account.`)
          // Clear the old account ID from database first
          const { error: clearError } = await supabase
            .from("photographers")
            .update({ stripe_account_id: null })
            .eq("user_id", user.id)

          if (clearError) {
            console.error("Error clearing old account ID:", clearError)
          } else {
            console.log("✅ Old account ID cleared from database")
          }

          accountId = null
        } else {
          console.log("✅ Account mode matches, using existing account")
        }
      } catch (error: any) {
        // If account doesn't exist or can't be retrieved (might be wrong mode), clear it
        console.log("⚠️  Could not retrieve existing account (might be wrong mode), clearing:", error.message)
        const { error: clearError } = await supabase
          .from("photographers")
          .update({ stripe_account_id: null })
          .eq("user_id", user.id)

        if (clearError) {
          console.error("Error clearing account ID:", clearError)
        }

        accountId = null
      }
    }

    if (!accountId) {
      // Create a new Stripe Connect Standard account
      const account = await stripe.accounts.create({
        type: "standard",
        country: "US", // Default to US, can be made configurable later
        email: photographer.email,
      })

      accountId = account.id

      // Save the Stripe account ID to the photographers table
      const { error: updateError } = await supabase
        .from("photographers")
        .update({ stripe_account_id: accountId })
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Error updating photographer with Stripe account ID:", updateError)
        return NextResponse.json(
          { error: "Failed to save Stripe account" },
          { status: 500 }
        )
      }
    }

    // Create account link for onboarding
    // For live mode, Stripe requires HTTPS URLs
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Check if we're using live mode keys (they start with sk_live_)
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')

    // If live mode and localhost, we need HTTPS (use ngrok or similar)
    // For development with test keys, HTTP is fine
    if (isLiveMode && (baseUrl.includes('localhost') || baseUrl.startsWith('http://'))) {
      console.warn("⚠️  Live mode detected with HTTP/localhost. Stripe requires HTTPS for live mode.")
      // Try to use a tunnel URL if available
      const tunnelUrl = process.env.NEXT_PUBLIC_TUNNEL_URL
      if (tunnelUrl && tunnelUrl.startsWith('https://')) {
        baseUrl = tunnelUrl
        console.log("Using tunnel URL:", baseUrl)
      } else {
        return NextResponse.json(
          {
            error: "Live mode requires HTTPS URLs. For local development:",
            solutions: [
              "1. Use test mode keys (sk_test_...) in your .env.local",
              "2. Set up HTTPS tunneling (ngrok, Cloudflare Tunnel, etc.) and set NEXT_PUBLIC_TUNNEL_URL",
              "3. Deploy to a staging environment with HTTPS"
            ]
          },
          { status: 400 }
        )
      }
    }

    // Determine link type: always validate account status before using account_update
    // Stripe doesn't allow account_update links for accounts that haven't completed initial onboarding
    let finalLinkType = linkType

    if (accountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(accountId) as any

        // Only use account_update if onboarding is complete (details_submitted = true)
        const hasCompletedOnboarding = existingAccount.details_submitted === true

        if (linkType === "account_update") {
          // If request wants account_update, validate the account is ready
          if (!hasCompletedOnboarding) {
            console.log("⚠️  Account not ready for account_update (onboarding incomplete), falling back to account_onboarding")
            finalLinkType = "account_onboarding"
          } else {
            // Check if there are actually requirements to update
            const requirements = (existingAccount.requirements || {}) as any
            const hasRequirements =
              (requirements.past_due && requirements.past_due.length > 0) ||
              (requirements.currently_due && requirements.currently_due.length > 0)

            if (!hasRequirements) {
              console.log("⚠️  Account has no requirements, using account_onboarding instead of account_update")
              finalLinkType = "account_onboarding"
            } else {
              console.log("✅ Account is ready for account_update")
            }
          }
        } else if (linkType === "account_onboarding" && hasCompletedOnboarding) {
          // If request wants account_onboarding but account is already onboarded, check for requirements
          const requirements = (existingAccount.requirements || {}) as any
          const hasRequirements =
            (requirements.past_due && requirements.past_due.length > 0) ||
            (requirements.currently_due && requirements.currently_due.length > 0)

          if (hasRequirements) {
            finalLinkType = "account_update"
            console.log("Account has completed onboarding and has requirements, using account_update link type")
          }
        }
      } catch (error: any) {
        // If we can't retrieve account, fall back to account_onboarding
        console.log("⚠️  Could not retrieve account to check status:", error.message)
        if (linkType === "account_update") {
          console.log("Falling back to account_onboarding")
          finalLinkType = "account_onboarding"
        }
      }
    } else {
      // No account ID, must use account_onboarding
      if (linkType === "account_update") {
        console.log("⚠️  No account ID, cannot use account_update, using account_onboarding")
        finalLinkType = "account_onboarding"
      }
    }

    // Create account link for onboarding or update
    // Double-check mode before creating link
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/dashboard?status=error`,
        return_url: `${baseUrl}/dashboard?status=success`,
        type: finalLinkType,
      })

      return NextResponse.json({
        url: accountLink.url,
        accountId: accountId,
      })
    } catch (linkError: any) {
      // If account_update fails because account isn't ready, fall back to account_onboarding
      if (
        finalLinkType === "account_update" &&
        (linkError.message?.includes("cannot create `account_update`") ||
          linkError.message?.includes("Valid types") ||
          linkError.code === "invalid_request_error")
      ) {
        console.log("⚠️  account_update not allowed, falling back to account_onboarding")
        try {
          const fallbackLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${baseUrl}/dashboard?status=error`,
            return_url: `${baseUrl}/dashboard?status=success`,
            type: "account_onboarding",
          })

          return NextResponse.json({
            url: fallbackLink.url,
            accountId: accountId,
          })
        } catch (fallbackError: any) {
          // If fallback also fails, throw the original error
          throw linkError
        }
      }

      // Re-throw if it's not the account_update error
      // If error is about mode mismatch, clear account and try again
      if (linkError.message?.includes('test mode') && linkError.message?.includes('live mode')) {
        console.log("⚠️  Account link creation failed due to mode mismatch. Clearing account and retrying...")

        // Clear the account ID
        await supabase
          .from("photographers")
          .update({ stripe_account_id: null })
          .eq("user_id", user.id)

        // Create a new account in the correct mode
        const newAccount = await stripe.accounts.create({
          type: "standard",
          country: "US",
          email: photographer.email,
        })

        // Save new account ID
        await supabase
          .from("photographers")
          .update({ stripe_account_id: newAccount.id })
          .eq("user_id", user.id)

        // Create account link with new account
        const accountLink = await stripe.accountLinks.create({
          account: newAccount.id,
          refresh_url: `${baseUrl}/dashboard?status=error`,
          return_url: `${baseUrl}/dashboard?status=success`,
          type: finalLinkType,
        })

        return NextResponse.json({
          url: accountLink.url,
          accountId: newAccount.id,
        })
      }

      // Re-throw if it's a different error
      throw linkError
    }

  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create Stripe Connect account" },
      { status: 500 }
    )
  }
}


