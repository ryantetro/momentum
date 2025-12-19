"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, FileText, Shield, Zap, Scale } from "lucide-react"
import { useToast } from "@/components/ui/toaster"

interface AIMagicToolbarProps {
  selectedText: string
  position: { x: number; y: number }
  onReplace: (text: string) => void
  onClose: () => void
}

const AI_ACTIONS = [
  {
    id: "formalize",
    label: "Formalize this",
    icon: FileText,
    prompt: "Rewrite this text in a more formal, professional legal tone while maintaining the same meaning.",
  },
  {
    id: "protective",
    label: "Make this more protective",
    icon: Shield,
    prompt: "Rewrite this text to be more protective and legally sound for a photography business contract.",
  },
  {
    id: "simplify",
    label: "Simplify this",
    icon: Zap,
    prompt: "Rewrite this text in simpler, clearer language while maintaining legal accuracy.",
  },
  {
    id: "legal-clarity",
    label: "Add legal clarity",
    icon: Scale,
    prompt: "Rewrite this text to add legal clarity and remove any ambiguity while keeping the same intent.",
  },
]

export function AIMagicToolbar({ selectedText, position, onReplace, onClose }: AIMagicToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  const handleAIAction = async (action: typeof AI_ACTIONS[0]) => {
    setLoading(action.id)

    try {
      const response = await fetch("/api/ai/improve-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: selectedText,
          instruction: action.prompt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to improve text")
      }

      if (data.success && data.improvedText) {
        onReplace(data.improvedText)
        onClose()
        toast({
          title: "Text improved",
          description: `Your text has been ${action.label.toLowerCase()}.`,
        })
      } else {
        throw new Error("Invalid response from AI")
      }
    } catch (error: any) {
      console.error("Error improving text:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to improve text",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-2 flex items-center gap-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 50}px`,
        transform: "translateX(-50%)",
      }}
    >
      <Sparkles className="h-4 w-4 text-purple-600 mr-1" />
      {AI_ACTIONS.map((action) => {
        const Icon = action.icon
        const isLoading = loading === action.id
        return (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            onClick={() => handleAIAction(action)}
            disabled={!!loading}
            className="text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Icon className="h-3 w-3 mr-1" />
                {action.label}
              </>
            )}
          </Button>
        )
      })}
    </div>
  )
}

