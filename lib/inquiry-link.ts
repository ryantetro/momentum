/**
 * Shared utility functions for inquiry link generation and copying
 */

export function getInquiryUrl(username: string | null): string | null {
  if (!username) return null
  
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  
  return `${baseUrl}/inquiry/${username}`
}

export function getShortenedUrl(username: string | null): string | null {
  if (!username) return null
  
  // Remove protocol and www for display
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.host
      : "momentum.app"
  
  return `${baseUrl}/inquiry/${username}`
}

export async function copyInquiryLink(url: string): Promise<void> {
  if (!url) {
    throw new Error("No inquiry URL available")
  }
  
  try {
    await navigator.clipboard.writeText(url)
  } catch (error) {
    throw new Error("Failed to copy link to clipboard")
  }
}



