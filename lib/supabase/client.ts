import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js"

// Singleton instance to prevent multiple GoTrueClient instances
let supabaseClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  // Return existing instance if it exists
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client that will throw helpful errors when used
    // This allows the app to compile and run without Supabase configured
    console.warn('Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
    
    // Return a client with placeholder values (will fail on actual use, but allows compilation)
    supabaseClient = createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
    return supabaseClient
  }

  // Create and cache the client instance
  supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey)
  return supabaseClient
}

