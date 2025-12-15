import { SignInForm } from "@/components/auth/sign-in-form"
import Link from "next/link"
import Image from "next/image"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logowords.png"
              alt="Momentum"
              width={200}
              height={60}
              className="object-contain"
              priority
            />
          </div>
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
  )
}

