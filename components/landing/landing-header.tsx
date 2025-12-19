"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

export function LandingHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isLandingPage = pathname === "/"

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleNavigation = async (sectionId: string) => {
    if (isLandingPage) {
      // If we're on the landing page, just scroll
      scrollToSection(sectionId)
    } else {
      // If we're on another page, navigate to landing page with hash
      await router.push(`/#${sectionId}`)
      // After navigation, scroll to the section
      // Use a longer delay to ensure the page has fully loaded
      setTimeout(() => {
        scrollToSection(sectionId)
      }, 500)
    }
  }

  // Handle hash fragments when landing page loads or when hash changes
  useEffect(() => {
    if (isLandingPage) {
      const handleHashChange = () => {
        if (window.location.hash) {
          const hash = window.location.hash.substring(1) // Remove the #
          // Small delay to ensure page is fully rendered
          setTimeout(() => {
            scrollToSection(hash)
          }, 300)
        }
      }

      // Handle initial hash on page load
      if (window.location.hash) {
        handleHashChange()
      }

      // Listen for hash changes (when navigating with hash)
      window.addEventListener("hashchange", handleHashChange)

      // Also check after a short delay in case navigation just completed
      const timeoutId = setTimeout(() => {
        if (window.location.hash) {
          handleHashChange()
        }
      }, 500)

      return () => {
        window.removeEventListener("hashchange", handleHashChange)
        clearTimeout(timeoutId)
      }
    }
  }, [isLandingPage])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logowords.png"
            alt="Momentum"
            width={120}
            height={35}
            className="object-contain"
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => handleNavigation("features")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </button>
          <button
            onClick={() => handleNavigation("pricing")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </button>
          <button
            onClick={() => handleNavigation("how-it-works")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </button>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <Link href="/sign-up">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">Try Free</Button>
          </Link>
        </nav>
        <div className="flex md:hidden items-center gap-2">
          <Link href="/sign-in" className="text-sm font-medium">
            Sign In
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0">Try Free</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

