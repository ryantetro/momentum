"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import { Sparkles, Loader2, AlertCircle, Wand2 } from "lucide-react"

interface ContractGeneratorProps {
  onContractGenerated: (contractText: string) => void
}

export function ContractGenerator({ onContractGenerated }: ContractGeneratorProps) {
  const [requirements, setRequirements] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!requirements.trim()) {
      toast({
        title: "Error",
        description: "Please enter your contract requirements",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requirements: requirements.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate contract")
      }

      if (data.success && data.contract) {
        onContractGenerated(data.contract)
        toast({
          title: "Contract generated",
          description: "Your contract has been generated and is ready to edit",
        })
        // Clear requirements after successful generation
        setRequirements("")
      } else {
        throw new Error("Invalid response from AI")
      }
    } catch (error: any) {
      console.error("Error generating contract:", error)
      setError(error.message || "Failed to generate contract. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to generate contract",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          AI Contract Generator
        </CardTitle>
        <CardDescription>
          Describe your contract requirements and let AI generate a professional contract for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="requirements" className="text-sm font-medium">
            Contract Requirements
          </label>
          <textarea
            id="requirements"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={8}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            placeholder="Example: Write me a wedding contract for a 10-hour day. Include a $500 non-refundable deposit, a clause about 6-week turnaround for photos, and a specific section about the client providing a meal for the photographer."
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Be specific about event type, duration, payment terms, delivery timeline, and any special clauses you need.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Generation Failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || !requirements.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Contract...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Contract
            </>
          )}
        </Button>

        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            AI-generated contracts are professional starting points. Always review and customize the generated contract to match your specific business needs. This is not a substitute for legal advice.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}



