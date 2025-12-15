"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function LandingHeader() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

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
            onClick={() => scrollToSection("features")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
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

