"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import { Sparkles, Loader2, AlertCircle, Shield } from "lucide-react"

interface AIContractInsightsProps {
  contractText: string
}

export function AIContractInsights({ contractText }: AIContractInsightsProps) {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string[] | null>(null)
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
    setFeedback(null)

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

      if (data.success && data.feedback) {
        setFeedback(data.feedback)
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

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Momentum AI Review
        </CardTitle>
        <CardDescription>
          Get instant feedback on your contract template's clarity and legal protection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!feedback && !error && (
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

        {feedback && feedback.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
              <Shield className="h-4 w-4" />
              AI Insights
            </div>
            <ul className="space-y-2">
              {feedback.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                AI-generated insights. Not a substitute for legal advice.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReview}
                className="mt-2 w-full"
                disabled={loading}
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}

