import { SignInForm } from "@/components/auth/sign-in-form"
import { LandingHeader } from "@/components/landing/landing-header"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <LandingHeader />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Sign In</h1>
            <p className="text-muted-foreground">
              Photography Business Management
            </p>
          </div>
          <SignInForm />
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

