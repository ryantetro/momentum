"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TemplateForm } from "@/components/contracts/template-form"
import type { ContractTemplate } from "@/types"

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  const [template, setTemplate] = useState<ContractTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/sign-in")
          return
        }

        const { data: photographer } = await supabase
          .from("photographers")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        if (!photographer) {
          return
        }

        const { data, error } = await supabase
          .from("contract_templates")
          .select("*")
          .eq("id", templateId)
          .eq("photographer_id", photographer.id)
          .single()

        if (error) throw error

        setTemplate(data)
      } catch (error) {
        console.error("Error fetching template:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId, supabase, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!template) {
    return <div>Template not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
        <p className="text-muted-foreground">
          Update your contract template
        </p>
      </div>
      <TemplateForm templateId={templateId} initialData={template} />
    </div>
  )
}

