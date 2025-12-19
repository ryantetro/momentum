"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toaster"
import { Sparkles, Loader2, Wand2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const QUICK_SUGGESTIONS = [
  { label: "Drone Usage", text: "Include a clause about drone photography usage rights and FAA compliance" },
  { label: "Travel Fees", text: "Add travel fee structure for destination weddings" },
  { label: "Raw Files", text: "Include policy on raw file delivery and editing rights" },
  { label: "Second Shooter", text: "Add clause about second photographer coverage" },
  { label: "50% Deposit", text: "Require 50% non-refundable deposit" },
  { label: "Content Creator", text: "Include social media usage rights and content creator clause" },
]

const PROGRESS_MESSAGES = [
  "Analyzing shoot requirements...",
  "Drafting liability clauses...",
  "Standardizing payment terms...",
  "Polishing for professional tone...",
]

interface AIGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContractGenerated: (contract: string) => void
}

export function AIGenerationModal({
  open,
  onOpenChange,
  onContractGenerated,
}: AIGenerationModalProps) {
  const [requirements, setRequirements] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState("")
  const [messageIndex, setMessageIndex] = useState(0)
  const { toast } = useToast()

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setRequirements("")
      setProgress(0)
      setMessageIndex(0)
      setCurrentMessage("")
    }
  }, [open])

  // Progress bar animation
  useEffect(() => {
    if (loading) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev
          return prev + 2
        })
      }, 100)

      return () => clearInterval(progressInterval)
    } else {
      setProgress(0)
    }
  }, [loading])

  // Cycle through progress messages
  useEffect(() => {
    if (loading) {
      setCurrentMessage(PROGRESS_MESSAGES[0])
      const messageInterval = setInterval(() => {
        setMessageIndex((prev) => {
          const nextIndex = (prev + 1) % PROGRESS_MESSAGES.length
          setCurrentMessage(PROGRESS_MESSAGES[nextIndex])
          return nextIndex
        })
      }, 2000)

      return () => clearInterval(messageInterval)
    } else {
      setCurrentMessage("")
      setMessageIndex(0)
    }
  }, [loading])

  const handleChipClick = (suggestion: string) => {
    if (loading) return
    setRequirements((prev) => {
      if (prev.trim()) {
        return prev + " " + suggestion
      }
      return suggestion
    })
  }

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
        setProgress(100)
        // Small delay to show completion
        setTimeout(() => {
          onContractGenerated(data.contract)
          setRequirements("")
          setProgress(0)
          onOpenChange(false)
          toast({
            title: "Contract generated",
            description: "Your contract has been generated and is ready to edit",
          })
        }, 300)
      } else {
        throw new Error("Invalid response from AI")
      }
    } catch (error: any) {
      console.error("Error generating contract:", error)
      setProgress(0)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {/* Progress Bar */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <DialogHeader className={loading ? "pt-6" : ""}>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Generate Contract with AI
          </DialogTitle>
          <DialogDescription>
            Describe your shoot requirements and we'll generate a professional contract for you
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="requirements">Shoot Requirements</Label>
            <textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Tell us about the shoot (e.g., 'A 10-hour wedding in Italy, 20% non-refundable deposit, drone footage included, 6-week turnaround for photos, client provides meal for photographer')"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about event type, duration, payment terms, delivery timeline, and any
              special clauses you need.
            </p>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Popular Clauses</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleChipClick(suggestion.text)}
                  disabled={loading}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium",
                    "border border-border/50 bg-background hover:bg-accent hover:border-blue-300",
                    "transition-colors duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  )}
                >
                  <Plus className="h-3 w-3" />
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || !requirements.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {currentMessage || "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Contract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

