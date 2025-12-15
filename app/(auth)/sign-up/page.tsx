import { SignUpForm } from "@/components/auth/sign-up-form"
import Image from "next/image"

export default function SignUpPage() {
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
        <SignUpForm />
      </div>
    </div>
  )
}

