"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import { Sparkles, Loader2, AlertCircle, Shield, CheckCircle2, AlertTriangle, Wand2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { RiskScoreMeter } from "@/components/contracts/risk-score-meter"

interface LegalProtection {
  name: string
  present: boolean
  notes?: string
}

interface AIContractInsightsProps {
  contractText: string
  onContractUpdated?: (newContract: string) => void
}

export function AIContractInsights({ contractText, onContractUpdated }: AIContractInsightsProps) {
  const [loading, setLoading] = useState(false)
  const [applyingFixes, setApplyingFixes] = useState(false)
  const [generatingClause, setGeneratingClause] = useState<string | null>(null)
  const [legalProtections, setLegalProtections] = useState<LegalProtection[] | null>(null)
  const [generalFeedback, setGeneralFeedback] = useState<string[] | null>(null)
  const [legacyFeedback, setLegacyFeedback] = useState<string[] | null>(null) // For backward compatibility
  const [error, setError] = useState<string | null>(null)
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
    setLegalProtections(null)
    setGeneralFeedback(null)
    setLegacyFeedback(null)

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
        // Handle new structured format
        if (data.legalProtections && data.generalFeedback) {
          setLegalProtections(data.legalProtections)
          setGeneralFeedback(data.generalFeedback)
        } else if (data.feedback) {
          // Fallback to legacy format
          setLegacyFeedback(data.feedback)
        } else {
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
          title: "Template updated",
          description: "Template updated with professional legal safeguards",
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
          contractContext: contractText.substring(0, 500), // First 500 chars for context
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate clause")
      }

      if (data.success && data.clause) {
        // Append clause to contract
        const newContract = contractText.trim() + "\n\n" + data.clause.trim()
        
        if (onContractUpdated) {
          onContractUpdated(newContract)
        }
        
        toast({
          title: "Clause added",
          description: `${clauseName} has been added to your contract`,
        })
        
        // Re-review the updated contract
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
    <Card className="border-2 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Momentum AI Review
        </CardTitle>
        <CardDescription>
          Analyze your contract for missing professional protections and legal safety nets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score Meter */}
        {legalProtections && legalProtections.length > 0 && (
          <RiskScoreMeter legalProtections={legalProtections} />
        )}

        {!legalProtections && !generalFeedback && !legacyFeedback && !error && (
          <Button
            onClick={handleReview}
            disabled={loading || !contractText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Review with AI
              </>
            )}
          </Button>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Review Failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReview}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Legal Protection Checklist */}
        {legalProtections && legalProtections.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
              <Shield className="h-4 w-4" />
              Legal Protection Checklist
            </div>
            <div className="space-y-2">
              {legalProtections.map((protection, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-md",
                    protection.present
                      ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      : "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                  )}
                >
                  {protection.present ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
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
                      className="text-xs flex-shrink-0"
                      onClick={() => handleGenerateClause(protection.name)}
                      disabled={generatingClause === protection.name || applyingFixes}
                    >
                      {generatingClause === protection.name ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1 h-3 w-3" />
                          Generate Clause
                        </>
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
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
              <Sparkles className="h-4 w-4" />
              General Feedback
            </div>
            <ul className="space-y-2">
              {generalFeedback.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Legacy Feedback Format (backward compatibility) */}
        {legacyFeedback && legacyFeedback.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
              <Shield className="h-4 w-4" />
              AI Insights
            </div>
            <ul className="space-y-2">
              {legacyFeedback.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(legalProtections || generalFeedback || legacyFeedback) && (
          <div className="pt-3 border-t space-y-3">
            {/* Apply All Recommendations Button */}
            {missingProtections.length > 0 && (
              <Button
                onClick={handleApplyAllFixes}
                disabled={applyingFixes || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {applyingFixes ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Drafting professional protections...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Apply All Recommendations
                  </>
                )}
              </Button>
            )}
            
            <p className="text-xs text-muted-foreground">
              AI-generated insights. Not a substitute for legal advice.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReview}
              className="w-full"
              disabled={loading || applyingFixes}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Re-analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Review Again
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


