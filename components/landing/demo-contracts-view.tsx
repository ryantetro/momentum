"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Sparkles, Loader2 } from "lucide-react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"

const sampleContract = `PHOTOGRAPHY SERVICES AGREEMENT

This Photography Services Agreement ("Agreement") is entered into between [Photographer Name] ("Photographer") and {{client_name}} ("Client") for photography services to be provided on {{event_date}}.

1. SERVICES
Photographer agrees to provide wedding photography services for the event scheduled on {{event_date}}. The total fee for these services is {{total_price}}.

2. PAYMENT TERMS
Client agrees to pay a non-refundable deposit of 30% upon signing this agreement. The remaining balance is due 14 days before the event date. Late payments may incur a 5% monthly fee.

3. COPYRIGHT AND USAGE RIGHTS
All photographs taken by Photographer are protected by copyright. Client receives personal use rights for the images. Commercial use requires written permission and additional licensing fees.

4. CANCELLATION POLICY
If Client cancels more than 30 days before the event, Client forfeits the deposit. Cancellations within 30 days require payment of 50% of the total fee. Cancellations within 14 days require full payment.

5. FORCE MAJEURE
Photographer is not liable for delays or failures due to circumstances beyond reasonable control, including but not limited to natural disasters, acts of God, or government restrictions.

6. LIABILITY
Photographer's liability is limited to the total amount paid for services. Photographer is not responsible for lost or damaged equipment, missed shots due to client delays, or circumstances beyond Photographer's control.

7. DELIVERY
Final edited images will be delivered within 6-8 weeks of the event date via online gallery. Client will have 90 days to download images before the gallery expires.

8. MODEL RELEASE
Client grants Photographer permission to use images for portfolio, marketing, and promotional purposes unless otherwise specified in writing.

By signing below, both parties agree to the terms of this agreement.

Client Signature: _________________ Date: _______

Photographer Signature: _________________ Date: _______`

export function DemoContractsView() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hasGenerated, setHasGenerated] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Click 'Generate Contract' to see AI magic in action...",
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[500px] text-foreground p-4",
      },
    },
  })

  const handleGenerate = async () => {
    if (hasGenerated) {
      // Reset if already generated
      editor?.commands.setContent("")
      setHasGenerated(false)
      setProgress(0)
      return
    }

    setIsGenerating(true)
    setProgress(0)

    // Simulate progress bar for 2 seconds
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + 5
      })
    }, 100)

    // Wait 2 seconds, then start typing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    clearInterval(progressInterval)
    setProgress(100)

    // Clear editor and start typing
    editor?.commands.setContent("")

    // Type out contract character by character
    let currentText = ""
    const typingSpeed = 30 // ms per character

    for (let i = 0; i < sampleContract.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, typingSpeed))
      currentText += sampleContract[i]
      
      // Replace variables with sample data
      const displayText = currentText
        .replace(/\{\{client_name\}\}/g, "Sarah & John Mitchell")
        .replace(/\{\{event_date\}\}/g, "June 15, 2024")
        .replace(/\{\{total_price\}\}/g, "$5,000")
        .replace(/\{\{service_type\}\}/g, "Wedding")

      editor?.commands.setContent(`<p>${displayText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`)
    }

    setIsGenerating(false)
    setHasGenerated(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Contracts</h2>
        <p className="text-sm text-muted-foreground">
          Generate professional contracts with AI
        </p>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : hasGenerated ? (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Again
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Contract
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI is writing your contract...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Editor */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card>
              <CardHeader>
                <CardTitle>Contract Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg bg-background">
                  <EditorContent editor={editor} />
                </div>
                {hasGenerated && !isGenerating && (
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    ✨ Contract generated! Variables are automatically replaced when sent to clients.
                  </p>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI generates contracts in seconds</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

