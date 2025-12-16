import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/client"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get photographer record for the logged-in user
    const { data: photographer, error: photographerError } = await supabase
      .from("photographers")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: "Photographer not found" },
        { status: 404 }
      )
    }

    // Check if photographer already has a Stripe account
    // If they do, create a new account link for the existing account
    let accountId = photographer.stripe_account_id

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
        .eq("user_id", session.user.id)

      if (updateError) {
        console.error("Error updating photographer with Stripe account ID:", updateError)
        return NextResponse.json(
          { error: "Failed to save Stripe account" },
          { status: 500 }
        )
      }
    }

    // Create account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard?status=error`,
      return_url: `${baseUrl}/dashboard?status=success`,
      type: "account_onboarding",
    })

    return NextResponse.json({
      url: accountLink.url,
      accountId: accountId,
    })
  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create Stripe Connect account" },
      { status: 500 }
    )
  }
}

