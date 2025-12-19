"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toaster"
import { AIContractInsights } from "./ai-contract-insights"
import { ContractPaperView } from "./contract-paper-view"
import { Tag, Save, Loader2, Sparkles, Eye, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const VARIABLES = [
  { key: "{{client_name}}", label: "Client Name", description: "Full name of the client" },
  { key: "{{event_date}}", label: "Event Date", description: "Formatted event date" },
  { key: "{{total_price}}", label: "Total Price", description: "Total price with currency" },
  { key: "{{service_type}}", label: "Service Type", description: "Type of service (e.g., Wedding, Portrait)" },
]

interface ContractTemplateEditorProps {
  initialTemplate?: string
  onSave?: (template: string) => void
}

export function ContractTemplateEditor({ initialTemplate = "", onSave }: ContractTemplateEditorProps) {
  const [template, setTemplate] = useState(initialTemplate)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate)
    }
  }, [initialTemplate])

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

      if (onSave) onSave(template)

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

  const handleContractUpdated = (newContract: string) => {
    setTemplate(newContract)
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0
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

    setTimeout(() => {
      textarea.focus()
      const newPosition = start + variable.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center bg-stone-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("edit")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-all",
              viewMode === "edit"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <FileText className="h-4 w-4" />
            Edit Template
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={cn(
              "flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-all",
              viewMode === "preview"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Eye className="h-4 w-4" />
            Live Preview
          </button>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="bg-stone-900 hover:bg-stone-800"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Template
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "edit" ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <Card className="border-stone-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {/* Variable Bank */}
                <div className="p-4 border-b border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-3.5 w-3.5 text-stone-400" />
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Variable Bank</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {VARIABLES.map((variable) => (
                      <button
                        key={variable.key}
                        type="button"
                        onClick={() => handleInsertVariable(variable.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                          "border border-stone-200 bg-white hover:border-blue-400 hover:bg-blue-50/50",
                          "transition-all duration-200 text-stone-700 shadow-sm",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        )}
                        title={variable.description}
                      >
                        <span className="text-blue-600 font-mono">{variable.key}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor Area */}
                <div className="relative group">
                  <textarea
                    ref={textareaRef}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className={cn(
                      "w-full min-h-[700px] p-8 md:p-12 bg-white",
                      "font-mono text-sm leading-relaxed text-stone-800",
                      "focus:outline-none",
                      "transition-all resize-none border-0"
                    )}
                    placeholder="Start typing your contract template here..."
                  />
                  <div className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-stone-50/80 backdrop-blur border border-stone-200 rounded-full text-[10px] text-stone-400 font-medium">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    Markdown Supported
                  </div>
                </div>
              </CardContent>
            </Card>

            <AIContractInsights
              contractText={template}
              onContractUpdated={handleContractUpdated}
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Sync Active
            </div>
            <div className="bg-stone-100/50 rounded-2xl p-4 md:p-12 border border-stone-200 shadow-inner min-h-[800px] overflow-x-auto">
              <ContractPaperView content={template} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


