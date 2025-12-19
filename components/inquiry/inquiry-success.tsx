"use client"

import { CheckCircle2 } from "lucide-react"

interface InquirySuccessProps {
  clientName: string
  photographerName: string
}

export function InquirySuccess({ clientName, photographerName }: InquirySuccessProps) {
  return (
    <div className="text-center space-y-4 py-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Thank you, {clientName}!</h2>
        <p className="text-muted-foreground">
          Your inquiry has been sent to <strong>{photographerName}</strong>. They will review the
          details and reach out shortly.
        </p>
      </div>
    </div>
  )
}

