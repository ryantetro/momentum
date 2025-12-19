"use client"

import { useSearchParams } from "next/navigation"
import { ContractEditor } from "@/components/contracts/contract-editor"

export default function NewTemplatePage() {
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



