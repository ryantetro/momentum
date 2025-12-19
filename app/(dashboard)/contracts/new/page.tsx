"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ContractEditor } from "@/components/contracts/contract-editor"

function ContractNewContent() {
  const searchParams = useSearchParams()
  const contentParam = searchParams.get("content")
  const initialContent = contentParam ? decodeURIComponent(contentParam) : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Contract Template</h1>
        <p className="text-muted-foreground">
          Create a new contract template with AI assistance
        </p>
      </div>
      <ContractEditor initialContent={initialContent} />
    </div>
  )
}

export default function NewTemplatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
      </div>
    }>
      <ContractNewContent />
    </Suspense>
  )
}



