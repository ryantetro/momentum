import Link from "next/link"
import Image from "next/image"

export function LandingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center">
            <Image
              src="/logowords.png"
              alt="Momentum"
              width={100}
              height={30}
              className="object-contain"
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign Up
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Momentum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

