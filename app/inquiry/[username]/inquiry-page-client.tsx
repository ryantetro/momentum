"use client"

import { useState } from "react"
import { InquiryForm } from "@/components/inquiry/inquiry-form"
import { InquirySuccess } from "@/components/inquiry/inquiry-success"

interface InquiryPageClientProps {
  photographerId: string
  photographerName: string
}

export function InquiryPageClient({ photographerId, photographerName }: InquiryPageClientProps) {
  const [submitted, setSubmitted] = useState(false)
  const [clientName, setClientName] = useState("")

  const handleSuccess = (name: string) => {
    setClientName(name)
    setSubmitted(true)
  }

  if (submitted) {
    return <InquirySuccess clientName={clientName} photographerName={photographerName} />
  }

  return (
    <InquiryForm
      photographerId={photographerId}
      photographerName={photographerName}
      onSuccess={(name) => handleSuccess(name)}
    />
  )
}

