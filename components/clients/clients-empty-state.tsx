"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Link2, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/toaster"
import Link from "next/link"

interface ClientsEmptyStateProps {
  inquiryUrl?: string
}

export function ClientsEmptyState({ inquiryUrl }: ClientsEmptyStateProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyLink = () => {
    if (!inquiryUrl) return

    navigator.clipboard.writeText(inquiryUrl)
    setCopied(true)
    toast({
      title: "Link copied",
      description: "Your inquiry link has been copied to clipboard",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        Get leads while you sleep. Copy your public inquiry link to start building your client list automatically.
      </p>
      
      {inquiryUrl && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg max-w-md mx-auto">
            <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <code className="text-xs text-foreground flex-1 text-left truncate">
              {inquiryUrl}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/clients/new">
          <Button variant="outline">
            Add Client Manually
          </Button>
        </Link>
      </div>
    </div>
  )
}



