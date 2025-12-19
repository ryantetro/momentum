"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"
import { ContractTemplateEditor } from "./contract-template-editor"
import { Loader2, Info } from "lucide-react"
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contract Template Editor */}
      <ContractTemplateEditor />

      {/* Signature Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Signature Requirements</CardTitle>
          <CardDescription>
            Configure how contract signatures are tracked and verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="signature-audit" className="text-base font-semibold">
                Require IP & Timestamp tracking on all signatures
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, all contract signatures will include IP address, timestamp, and user
                agent information for legal protection and audit trails.
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
          {saving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Available Placeholders
          </CardTitle>
          <CardDescription>
            Use these placeholders in your contract template. They will be automatically replaced
            with actual values when generating proposals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PLACEHOLDERS.map((placeholder) => (
              <div
                key={placeholder.key}
                className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
              >
                <code className="text-sm font-mono bg-background px-2 py-1 rounded border">
                  {placeholder.key}
                </code>
                <p className="text-sm text-muted-foreground flex-1">{placeholder.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

