"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Edit, Trash2, Copy, Star, Sparkles, Plus, Shield, CheckCircle2, AlertTriangle } from "lucide-react"
import type { ContractTemplate } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toaster"
import { formatDistanceToNow } from "date-fns"
import { isMarkdown, markdownToHtml } from "@/lib/markdown"
import { cn } from "@/lib/utils"

interface TemplateListProps {
  templates: ContractTemplate[]
  onAIGenerate?: () => void
  onManualCreate?: () => void
}

// Helper function to extract preview from content
function getContentPreview(content: string, maxLength: number = 200): string {
  if (!content) return ""
  
  // Remove HTML tags if present
  const textOnly = content.replace(/<[^>]*>/g, "")
  
  // Extract first portion
  const preview = textOnly.substring(0, maxLength)
  
  // Try to end at a sentence boundary
  const lastPeriod = preview.lastIndexOf(".")
  const lastNewline = preview.lastIndexOf("\n")
  const cutPoint = Math.max(lastPeriod, lastNewline)
  
  if (cutPoint > maxLength * 0.5) {
    return preview.substring(0, cutPoint + 1)
  }
  
  return preview + (textOnly.length > maxLength ? "..." : "")
}

// Helper function to calculate risk score based on content
function calculateRiskScore(content: string): { score: number; level: "high" | "moderate" | "low"; label: string } {
  if (!content) {
    return { score: 0, level: "high", label: "High Risk" }
  }
  
  // Check for key legal protections
  const protections = [
    /cancellation|refund|deposit/i,
    /copyright|usage rights|license/i,
    /liability|indemnification|waiver/i,
    /payment|deposit|balance|fee/i,
    /force majeure|weather|contingency/i,
    /delivery|timeline|turnaround/i,
  ]
  
  const found = protections.filter(pattern => pattern.test(content)).length
  const score = Math.round((found / protections.length) * 100)
  
  if (score <= 40) {
    return { score, level: "high", label: "High Risk" }
  } else if (score <= 70) {
    return { score, level: "moderate", label: "Moderate Risk" }
  } else {
    return { score, level: "low", label: "Professional Grade" }
  }
}

// Helper function to check if template is AI-generated
function isAIGenerated(content: string): boolean {
  if (!content) return false
  
  // Check for Markdown formatting (AI generates Markdown)
  if (isMarkdown(content)) {
    return true
  }
  
  // Check for structured sections (AI tends to create well-structured contracts)
  const hasStructuredSections = /##\s+\d+\.|^##\s+[A-Z]|^\d+\.\s+[A-Z]/m.test(content)
  const hasMultipleSections = (content.match(/##|^\d+\./gm) || []).length >= 3
  
  return hasStructuredSections && hasMultipleSections
}

export function TemplateList({ templates, onAIGenerate, onManualCreate }: TemplateListProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed p-12 text-center">
        <div className="mx-auto max-w-md space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground">
              Create your first contract template to get started. Use AI to generate one instantly
              or build it manually.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onAIGenerate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Generate with AI
            </Button>
            <Button onClick={onManualCreate} variant="outline" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Manually
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) return

      const { error } = await supabase
        .from("contract_templates")
        .delete()
        .eq("id", id)
        .eq("photographer_id", photographer.id)

      if (error) throw error

      toast({ title: "Template deleted successfully" })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  const handleDuplicate = async (template: ContractTemplate) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) return

      const { error } = await supabase.from("contract_templates").insert({
        photographer_id: photographer.id,
        name: `${template.name} (Copy)`,
        content: template.content,
        is_default: false,
        usage_count: 0,
      })

      if (error) throw error

      toast({ title: "Template duplicated successfully" })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate template",
        variant: "destructive",
      })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const { data: photographer } = await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!photographer) return

      // Unset all defaults
      await supabase
        .from("contract_templates")
        .update({ is_default: false })
        .eq("photographer_id", photographer.id)

      // Set this one as default
      const { error } = await supabase
        .from("contract_templates")
        .update({ is_default: true })
        .eq("id", id)
        .eq("photographer_id", photographer.id)

      if (error) throw error

      toast({ title: "Default template updated" })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set default template",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {templates.map((template) => {
        const aiGenerated = isAIGenerated(template.content)
        const riskInfo = calculateRiskScore(template.content)
        const previewText = getContentPreview(template.content, 200)
        const previewIsMarkdown = isMarkdown(template.content)
        const previewHtml = previewIsMarkdown ? markdownToHtml(previewText) : null
        
        return (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.is_default && (
                      <Badge variant="default" className="bg-blue-600">
                        Default
                      </Badge>
                    )}
                    {aiGenerated && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-800">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        riskInfo.level === "low" && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800",
                        riskInfo.level === "moderate" && "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800",
                        riskInfo.level === "high" && "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800"
                      )}
                    >
                      {riskInfo.level === "low" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {riskInfo.level === "moderate" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {riskInfo.level === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {riskInfo.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>
                      Modified {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                    </span>
                    {template.usage_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {template.usage_count} {template.usage_count === 1 ? "use" : "uses"}
                      </Badge>
                    )}
                    {aiGenerated && (
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <Shield className="h-3 w-3" />
                        AI Optimized
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Markdown Preview */}
              {previewHtml ? (
                <div
                  className="text-sm text-muted-foreground line-clamp-3 mb-4 template-preview"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {previewText}...
                </p>
              )}
              <style jsx>{`
                .template-preview :global(h2) {
                  font-size: 0.875rem;
                  font-weight: 600;
                  margin-top: 0.5rem;
                  margin-bottom: 0.25rem;
                  color: inherit;
                }
                .template-preview :global(h3) {
                  font-size: 0.8125rem;
                  font-weight: 600;
                  margin-top: 0.375rem;
                  margin-bottom: 0.125rem;
                  color: inherit;
                }
                .template-preview :global(strong) {
                  font-weight: 600;
                  color: inherit;
                }
                .template-preview :global(p) {
                  margin-bottom: 0.25rem;
                }
                .template-preview :global(ul),
                .template-preview :global(ol) {
                  margin-left: 1rem;
                  margin-bottom: 0.25rem;
                }
              `}</style>
            <div className="flex flex-wrap gap-2">
              <Link href={`/contracts/${template.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicate(template)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              {!template.is_default && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(template.id)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Set Default
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(template.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}
