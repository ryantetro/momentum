"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"
import { AIContractInsights } from "./ai-contract-insights"
import { ContractGenerator } from "./contract-generator"
import { Wand2, FileText, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

const VARIABLES = [
  { key: "{{client_name}}", label: "Client Name", description: "Full name of the client" },
  { key: "{{event_date}}", label: "Event Date", description: "Formatted event date" },
  { key: "{{total_price}}", label: "Total Price", description: "Total price with currency" },
  { key: "{{service_type}}", label: "Service Type", description: "Type of service (e.g., Wedding, Portrait)" },
]

export function ContractTemplateEditor() {
  const [template, setTemplate] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"generate" | "edit">("generate")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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

      toast({
        title: "Default template saved!",
        description: "This template will be used for all new inquiries and bookings.",
      })
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

  const handleContractGenerated = (contractText: string) => {
    setTemplate(contractText)
    setActiveTab("edit")
  }

  const handleContractUpdated = (newContract: string) => {
    setTemplate(newContract)
    // Scroll to top of textarea for visibility
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0
      // Add a brief visual flash
      textareaRef.current.classList.add("contract-updated")
      setTimeout(() => {
        textareaRef.current?.classList.remove("contract-updated")
      }, 1000)
    }
  }

  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = template
    const before = text.substring(0, start)
    const after = text.substring(end)

    const newText = before + variable + after
    setTemplate(newText)

    // Restore cursor position after variable
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + variable.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "generate"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wand2 className="h-4 w-4" />
          Generate
        </button>
        <button
          onClick={() => setActiveTab("edit")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "edit"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Edit
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "generate" && (
        <div className="max-w-2xl">
          <ContractGenerator onContractGenerated={handleContractGenerated} />
        </div>
      )}

      {activeTab === "edit" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contract Template</CardTitle>
              <CardDescription>
                Create your master contract template. This will be used as the default for all new inquiries and bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Variable Bank */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Variable Bank</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {VARIABLES.map((variable) => (
                    <button
                      key={variable.key}
                      type="button"
                      onClick={() => handleInsertVariable(variable.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
                        "border border-border/50 bg-background hover:bg-accent hover:border-blue-300",
                        "transition-colors duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      )}
                      title={variable.description}
                    >
                      <code className="text-blue-600 dark:text-blue-400 font-mono">
                        {variable.key}
                      </code>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click a variable to insert it at your cursor position
                </p>
              </div>

              <div className="space-y-2">
                {/* Page View Wrapper for Textarea */}
                <div className="page-view-wrapper">
                  <div className="page-view-textarea bg-white shadow-lg">
                    <textarea
                      ref={textareaRef}
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      rows={20}
                      className="page-textarea flex w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono transition-colors"
                      placeholder="Enter your contract template here. Click variables above to insert placeholders."
                    />
                  </div>
                </div>
                <style jsx global>{`
                  .page-view-wrapper {
                    width: 100%;
                    max-width: 8.5in;
                    margin: 0 auto;
                  }
                  
                  .page-view-textarea {
                    width: 100%;
                    min-height: 11in;
                    aspect-ratio: 8.5 / 11;
                    max-width: 100%;
                    padding: 1in;
                    border: 1px solid #e5e7eb;
                  }
                  
                  .page-textarea {
                    min-height: calc(11in - 2in);
                    font-size: 12pt;
                    line-height: 1.6;
                  }
                  
                  @media (max-width: 1024px) {
                    .page-view-textarea {
                      aspect-ratio: 8.5 / 11;
                      min-height: auto;
                      padding: 0.75in;
                    }
                    
                    .page-textarea {
                      min-height: calc(11in - 1.5in);
                    }
                  }
                  
                  @media (max-width: 768px) {
                    .page-view-textarea {
                      padding: 0.5in;
                    }
                    
                    .page-textarea {
                      min-height: calc(11in - 1in);
                      font-size: 11pt;
                    }
                  }
                  
                  .contract-updated {
                    animation: contractFlash 1s ease-in-out;
                  }
                  
                  @keyframes contractFlash {
                    0% { background-color: transparent; }
                    50% { background-color: rgba(59, 130, 246, 0.1); }
                    100% { background-color: transparent; }
                  }
                `}</style>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save as Default"}
              </Button>
            </CardContent>
          </Card>
          <AIContractInsights 
            contractText={template} 
            onContractUpdated={handleContractUpdated}
          />
        </div>
      )}
    </div>
  )
}


