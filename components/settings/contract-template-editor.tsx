"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"

export function ContractTemplateEditor() {
  const [template, setTemplate] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        const { data: photographer } = await supabase
          .from("photographers")
          .select("contract_template")
          .eq("user_id", session.user.id)
          .single()

        if (photographer?.contract_template) {
          setTemplate(photographer.contract_template)
        }
      } catch (error) {
        console.error("Error fetching template:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to save the template",
          variant: "destructive",
        })
        return
      }

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) {
        throw new Error("Photographer not found")
      }

      const { error } = await supabase
        .from("photographers")
        .update({ contract_template: template })
        .eq("id", photographer.id)

      if (error) throw error

      toast({ title: "Contract template saved successfully" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Template</CardTitle>
        <CardDescription>
          Create your contract template. Use placeholders like {"{{client_name}}"}, {"{{event_date}}"}, {"{{total_price}}"}, and {"{{service_type}}"} that will be replaced when generating proposals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={20}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter your contract template here. Use placeholders: {{client_name}}, {{event_date}}, {{total_price}}, {{service_type}}"
          />
          <p className="text-xs text-muted-foreground">
            Available placeholders: {"{{client_name}}"}, {"{{event_date}}"}, {"{{total_price}}"}, {"{{service_type}}"}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </CardContent>
    </Card>
  )
}

