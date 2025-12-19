"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import { Sparkles, Loader2, AlertCircle, Shield, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Wand2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { RiskScoreMeter } from "@/components/contracts/risk-score-meter"

interface LegalProtection {
  name: string
  present: boolean
  notes?: string
}

interface EditorAIAssistantProps {
  contractText: string
  onContractUpdated?: (newContract: string) => void
}

export function EditorAIAssistant({ contractText, onContractUpdated }: EditorAIAssistantProps) {
  const [loading, setLoading] = useState(false)
  const [applyingFixes, setApplyingFixes] = useState(false)
  const [generatingClause, setGeneratingClause] = useState<string | null>(null)
  const [legalProtections, setLegalProtections] = useState<LegalProtection[] | null>(null)
  const [generalFeedback, setGeneralFeedback] = useState<string[] | null>(null)
  const [feedback, setFeedback] = useState<string[] | null>(null) // For backward compatibility
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const { toast } = useToast()

  const handleReview = async () => {
    if (!contractText.trim()) {
      toast({
        title: "Error",
        description: "Please enter contract text before reviewing",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)
    setFeedback(null)
    setLegalProtections(null)
    setGeneralFeedback(null)
    setExpanded(true)

    try {
      const response = await fetch("/api/ai/review-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_text: contractText,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to review contract")
      }

      if (data.success) {
        // Handle structured response with legalProtections and generalFeedback
        if (data.legalProtections && data.generalFeedback) {
          setLegalProtections(data.legalProtections)
          setGeneralFeedback(data.generalFeedback)
          
          // Also create combined feedback for backward compatibility
          const combinedFeedback: string[] = []
          data.legalProtections.forEach((protection: LegalProtection) => {
            const icon = protection.present ? "✓" : "⚠"
            const status = protection.present ? "Present" : "Missing"
            const note = protection.notes ? ` - ${protection.notes}` : ""
            combinedFeedback.push(`${icon} ${protection.name}: ${status}${note}`)
          })
          if (data.legalProtections.length > 0 && data.generalFeedback.length > 0) {
            combinedFeedback.push("")
          }
          combinedFeedback.push(...data.generalFeedback)
          setFeedback(combinedFeedback)
        } 
        // Handle fallback format with just feedback array
        else if (data.feedback && Array.isArray(data.feedback)) {
          setFeedback(data.feedback)
        } 
        // Fallback to raw response if available
        else if (data.rawResponse) {
          const lines = data.rawResponse.split("\n")
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0)
          setFeedback(lines)
        } 
        else {
          throw new Error("Invalid response from AI")
        }
        
        toast({
          title: "Contract reviewed",
          description: "AI analysis complete",
        })
      } else {
        throw new Error("Invalid response from AI")
      }
    } catch (error: any) {
      console.error("Error reviewing contract:", error)
      setError(error.message || "Failed to review contract. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to review contract",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyAllFixes = async () => {
    if (!legalProtections || !contractText.trim()) return

    const missingClauses = legalProtections
      .filter((p) => !p.present)
      .map((p) => p.name)

    if (missingClauses.length === 0) {
      toast({
        title: "No fixes needed",
        description: "All legal protections are already present",
      })
      return
    }

    setApplyingFixes(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/apply-fixes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_text: contractText,
          missingClauses,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply fixes")
      }

      if (data.success && data.improvedContract) {
        if (onContractUpdated) {
          onContractUpdated(data.improvedContract)
        }
        toast({
          title: "Contract updated",
          description: "Contract updated with professional legal safeguards",
        })
        // Re-review the updated contract
        setTimeout(() => {
          handleReview()
        }, 500)
      } else {
        throw new Error("Invalid response from AI")
      }
    } catch (error: any) {
      console.error("Error applying fixes:", error)
      setError(error.message || "Failed to apply fixes. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to apply fixes",
        variant: "destructive",
      })
    } finally {
      setApplyingFixes(false)
    }
  }

  const handleGenerateClause = async (clauseName: string) => {
    setGeneratingClause(clauseName)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-clause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clauseName,
          contractContext: contractText.substring(0, 500),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate clause")
      }

      if (data.success && data.clause) {
        const newContract = contractText.trim() + "\n\n" + data.clause.trim()
        
        if (onContractUpdated) {
          onContractUpdated(newContract)
        }
        
        toast({
          title: "Clause added",
          description: `${clauseName} has been added to your contract`,
        })
        
        setTimeout(() => {
          handleReview()
        }, 500)
      } else {
        throw new Error("Invalid response from AI")
      }
    } catch (error: any) {
      console.error("Error generating clause:", error)
      setError(error.message || "Failed to generate clause. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to generate clause",
        variant: "destructive",
      })
    } finally {
      setGeneratingClause(null)
    }
  }

  const missingProtections = legalProtections?.filter((p) => !p.present) || []

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-blue-600" />
            AI Assistant
          </CardTitle>
          {feedback && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <CardDescription className="text-xs">
          Get instant feedback on your contract
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Risk Score Meter */}
        {legalProtections && legalProtections.length > 0 && expanded && (
          <RiskScoreMeter legalProtections={legalProtections} />
        )}

        {!feedback && !error && (
          <Button
            onClick={handleReview}
            disabled={loading || !contractText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-3 w-3" />
                Review Contract
              </>
            )}
          </Button>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-900 dark:text-red-100">
                  Review Failed
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReview}
                  className="mt-2 text-xs"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {feedback && feedback.length > 0 && expanded && (
          <div className="space-y-2">
            {/* Structured Legal Protections */}
            {legalProtections && legalProtections.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-900 dark:text-blue-100">
                  <Shield className="h-3 w-3" />
                  Legal Protection Checklist
                </div>
                <div className="space-y-1.5">
                  {legalProtections.map((protection, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded-md text-xs",
                        protection.present
                          ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                          : "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                      )}
                    >
                      {protection.present ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          {protection.name}
                        </p>
                        {protection.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {protection.notes}
                          </p>
                        )}
                      </div>
                      {!protection.present && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs flex-shrink-0 h-6 px-2"
                          onClick={() => handleGenerateClause(protection.name)}
                          disabled={generatingClause === protection.name || applyingFixes}
                        >
                          {generatingClause === protection.name ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Feedback */}
            {generalFeedback && generalFeedback.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-900 dark:text-blue-100">
                  <Sparkles className="h-3 w-3" />
                  General Feedback
                </div>
                <ul className="space-y-1.5">
                  {generalFeedback.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-foreground">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fallback: Legacy feedback format */}
            {!legalProtections && !generalFeedback && feedback && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-900 dark:text-blue-100">
                  <Shield className="h-3 w-3" />
                  AI Insights
                </div>
                <ul className="space-y-1.5">
                  {feedback.map((item, index) => {
                    const isPositive = item.toLowerCase().includes("good") || 
                                     item.toLowerCase().includes("clear") ||
                                     item.toLowerCase().includes("well") ||
                                     item.toLowerCase().includes("includes")
                    const isWarning = item.toLowerCase().includes("missing") ||
                                    item.toLowerCase().includes("lack") ||
                                    item.toLowerCase().includes("should") ||
                                    item.toLowerCase().includes("consider")
                    
                    return (
                      <li key={index} className="flex items-start gap-2 text-xs text-foreground">
                        {isPositive ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : isWarning ? (
                          <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                        )}
                        <span className="flex-1">{item}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Apply All Recommendations Button */}
            {missingProtections.length > 0 && (
              <Button
                onClick={handleApplyAllFixes}
                disabled={applyingFixes || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                size="sm"
              >
                {applyingFixes ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Drafting professional protections...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-3 w-3" />
                    Apply All Recommendations
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleReview}
              className="w-full text-xs"
              disabled={loading || applyingFixes}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Re-analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3 w-3" />
                  Review Again
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              AI-generated insights. Not a substitute for legal advice.
            </p>
          </div>
        )}

        {feedback && !expanded && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(true)}
            className="w-full text-xs"
          >
            Show Insights ({feedback.length})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

