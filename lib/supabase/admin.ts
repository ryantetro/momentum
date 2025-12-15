import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Admin client with service role key for server-side operations
// Use this for operations that need to bypass RLS (like file uploads)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      "Supabase admin environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    )
    return createSupabaseClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    )
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

