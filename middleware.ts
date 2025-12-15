import { NextResponse, type NextRequest } from "next/server"

// Simplified middleware - auth checks will be handled in pages/components
export async function middleware(request: NextRequest) {
  // For MVP, we'll handle auth in the pages themselves
  // This avoids the @supabase/ssr dependency issue
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     * - portal routes (public)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|portal).*)",
  ],
}

