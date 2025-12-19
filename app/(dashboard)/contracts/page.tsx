"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TemplateList } from "@/components/contracts/template-list"
import { AIGenerationModal } from "@/components/contracts/ai-generation-modal"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Sparkles } from "lucide-react"
import type { ContractTemplate } from "@/types"

export default function ContractsPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
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
          .eq("photographer_id", photographer.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false })

        if (error) throw error

        setTemplates(data || [])
      } catch (error) {
        console.error("Error fetching templates:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 w-48 animate-pulse rounded bg-muted"></div>
            <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="h-10 w-32 animate-pulse rounded bg-muted"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg border bg-muted"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contract Templates</h1>
          <p className="text-muted-foreground">
            Manage your contract templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setAiModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
          <Button
            onClick={() => router.push("/contracts/new")}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Manually
          </Button>
        </div>
      </div>
      <TemplateList
        templates={templates}
        onAIGenerate={() => setAiModalOpen(true)}
        onManualCreate={() => router.push("/contracts/new")}
      />
      <AIGenerationModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onContractGenerated={(contract) => {
          // Navigate to new template page with generated content
          router.push(`/contracts/new?content=${encodeURIComponent(contract)}`)
        }}
      />
    </div>
  )
}

