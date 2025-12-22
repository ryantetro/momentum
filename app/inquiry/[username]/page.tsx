import { createClient } from "@/lib/supabase/server"
import { InquiryPageClient } from "./inquiry-page-client"
import { PhotographerAvatar } from "@/components/inquiry/photographer-avatar"
import { ToastProvider } from "@/components/ui/toaster"

export default async function InquiryPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  // Lookup photographer by username (case-insensitive match)
  // Try exact match first, then case-insensitive if needed
  // Note: We try to select first_name and last_name, but handle gracefully if they don't exist
  let { data: photographer, error } = await supabase
    .from("photographers")
    .select("id, business_name, studio_name, logo_url, email, username")
    .eq("username", username)
    .single()

  // If exact match fails, try case-insensitive
  if (error || !photographer) {
    const { data: photographerData, error: photographerError } = await supabase
      .from("photographers")
      .select("id, business_name, studio_name, logo_url, email, username")
      .ilike("username", username)
      .single()

    photographer = photographerData
    error = photographerError
  }

  // Try to fetch first_name and last_name if columns exist (graceful fallback)
  // We check for the error code to see if columns don't exist
  if (photographer && !error) {
    const { data: nameData, error: nameError } = await supabase
      .from("photographers")
      .select("first_name, last_name")
      .eq("id", photographer.id)
      .single()

    // Only merge if we got data and no error (columns exist)
    // Error code 42703 means column doesn't exist
    if (nameData && !nameError) {
      photographer = { ...photographer, first_name: nameData.first_name, last_name: nameData.last_name }
    } else if (nameError && nameError.code !== "42703") {
      // Only log if it's not a "column doesn't exist" error
      // Set to null so the fallback logic works
      photographer = { ...photographer, first_name: null, last_name: null }
    } else {
      // Column doesn't exist - set to null
      photographer = { ...photographer, first_name: null, last_name: null }
    }
  }

  if (error || !photographer) {
    // Log the error for debugging (only in development)
    // But don't log if it's just a missing column error (42703)
    if (process.env.NODE_ENV === 'development' && error?.code !== '42703') {
      console.error('Photographer lookup error:', error)
      console.error('Looking for username:', username)
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold">Photographer Not Found</h1>
          <p className="text-muted-foreground">
            The inquiry link you're looking for doesn't exist or has been removed.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-muted-foreground mt-4">
              Username searched: {username}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Priority: Business Name → Studio Name → First + Last Name → Email
  const photographerName =
    photographer.business_name ||
    photographer.studio_name ||
    (photographer.first_name && photographer.last_name
      ? `${photographer.first_name} ${photographer.last_name}`
      : null) ||
    photographer.email

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="mb-6 flex justify-center">
                  <PhotographerAvatar
                    logoUrl={photographer.logo_url}
                    name={photographerName}
                    size="lg"
                  />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Inquire with {photographerName}
                </h1>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  Tell us about your event and we'll get back to you shortly!
                </p>
              </div>

              {/* Form */}
              <InquiryPageClient
                photographerId={photographer.id}
                photographerName={photographerName}
              />

              {/* Powered by Momentum */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-400">
                  Powered by{" "}
                  <span className="font-semibold text-gray-600">Momentum</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}

