import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client that will throw helpful errors when used
    // This allows the app to compile and run without Supabase configured
    console.warn('Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
    
    // Return a client with placeholder values (will fail on actual use, but allows compilation)
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  const cookieStore = await cookies()

  // Debug: Log all cookies to see what we're working with
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(c => 
    c.name.includes('auth') || c.name.startsWith('sb-')
  )
  if (authCookies.length > 0) {
    console.log("Found auth cookies:", authCookies.map(c => c.name))
  } else {
    console.log("No auth cookies found. All cookies:", allCookies.map(c => c.name))
  }

  // Create client with cookie-based storage
  // Supabase uses cookies with names like: sb-<project-ref>-auth-token
  const client = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          const cookie = cookieStore.get(key)
          if (!cookie?.value) {
            // Try to find cookie by partial match (for split cookies)
            const partialMatch = allCookies.find(c => 
              c.name.startsWith(key.split('.')[0]) || key.includes(c.name.split('.')[0])
            )
            if (partialMatch?.value) {
              console.log(`Found cookie by partial match: ${partialMatch.name} for key: ${key}`)
              return partialMatch.value
            }
            return null
          }
          
          // Handle base64-encoded cookies (some Supabase versions use this)
          if (cookie.value.startsWith('base64-')) {
            try {
              const base64Data = cookie.value.substring(7) // Remove 'base64-' prefix
              const decoded = Buffer.from(base64Data, 'base64').toString('utf-8')
              return decoded
            } catch {
              return cookie.value
            }
          }
          
          return cookie.value
        },
        setItem: (_key: string, _value: string) => {
          // Server-side: cookies are read-only, set by client
        },
        removeItem: (_key: string) => {
          // Server-side: cookies are read-only
        },
      },
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return client
}
