import { SignUpForm } from "@/components/auth/sign-up-form"
import { LandingHeader } from "@/components/landing/landing-header"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <LandingHeader />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Photography Business Management
            </p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}

