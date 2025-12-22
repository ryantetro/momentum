"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"
import { ContractTemplateEditor } from "./contract-template-editor"
import { ContractGenerator } from "./contract-generator"
import { ContractUploader } from "./contract-uploader"
import { Loader2, Info, Wand2, FileText, Upload, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Photographer } from "@/types"

const PLACEHOLDERS = [
  { key: "{{client_name}}", description: "Client's full name" },
  { key: "{{event_date}}", description: "Event date (formatted)" },
  { key: "{{total_price}}", description: "Total price (formatted with currency)" },
  { key: "{{service_type}}", description: "Service type (e.g., Wedding, Portrait)" },
]

export function ContractDefaultsTab() {
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requireSignatureAudit, setRequireSignatureAudit] = useState(true)
  const [activeMode, setActiveMode] = useState<"generate" | "edit" | "upload">("edit")
  const [template, setTemplate] = useState("")
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchPhotographer() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        const { data } = await supabase
          .from("photographers")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (data) {
          setPhotographer(data)
          setRequireSignatureAudit(data.require_signature_audit ?? true)
          setTemplate(data.contract_template || "")
        }
      } catch (error) {
        console.error("Error fetching photographer:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotographer()
  }, [supabase])

  const handleSaveSignatureSetting = async () => {
    if (!photographer) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from("photographers")
        .update({
          require_signature_audit: requireSignatureAudit,
        })
        .eq("id", photographer.id)

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "Your signature requirements have been updated",
      })
    } catch (error: any) {
      console.error("Error saving signature settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleContractUpdated = (newContent: string) => {
    setTemplate(newContent)
    setActiveMode("edit")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-stone-900">Document Management Center</h2>
          <p className="text-stone-500">Configure your master contract templates and legal safeguards</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveMode("generate")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
              activeMode === "generate"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Wand2 className="h-4 w-4" />
            AI Generate
          </button>
          <button
            onClick={() => setActiveMode("edit")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
              activeMode === "edit"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <FileText className="h-4 w-4" />
            Edit Template
          </button>
          <button
            onClick={() => setActiveMode("upload")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
              activeMode === "upload"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Upload className="h-4 w-4" />
            Upload PDF/Doc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-12">
          {activeMode === "generate" && (
            <div className="max-w-3xl mx-auto">
              <ContractGenerator onContractGenerated={handleContractUpdated} />
            </div>
          )}

          {activeMode === "edit" && (
            <ContractTemplateEditor
              initialTemplate={template}
              onSave={(newTemplate: string) => setTemplate(newTemplate)}
            />
          )}

          {activeMode === "upload" && (
            <div className="max-w-3xl mx-auto">
              <ContractUploader onContractParsed={handleContractUpdated} />
            </div>
          )}
        </div>

        {/* Legal Settings Sidebar/Bottom */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Signature Requirements */}
          <Card className="border-stone-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-stone-600" />
                Legal Safeguards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="signature-audit" className="text-sm font-semibold text-stone-800">
                    IP & Timestamp Tracking
                  </Label>
                  <p className="text-xs text-stone-500">
                    Include IP address and timestamp on all signatures for legal audit trails.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="signature-audit"
                    checked={requireSignatureAudit}
                    onChange={(e) => {
                      setRequireSignatureAudit(e.target.checked)
                      handleSaveSignatureSetting()
                    }}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder Reference */}
          <Card className="border-stone-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-stone-600" />
                Dynamic Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {PLACEHOLDERS.map((placeholder) => (
                  <div
                    key={placeholder.key}
                    className="flex flex-col p-2 rounded border border-stone-100 bg-stone-50/50"
                  >
                    <code className="text-[10px] font-mono text-blue-600 mb-1">
                      {placeholder.key}
                    </code>
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider">{placeholder.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



