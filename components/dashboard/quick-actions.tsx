"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Plus, Sparkles, Link2 } from "lucide-react"
import { useToast } from "@/components/ui/toaster"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function QuickActions() {
  const [copied, setCopied] = useState(false)
  const [inquiryUrl, setInquiryUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchInquiryUrl() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) return

        const { data: photographer } = await supabase
          .from("photographers")
          .select("username")
          .eq("user_id", session.user.id)
          .single()

        if (photographer?.username) {
          const baseUrl = typeof window !== "undefined"
            ? window.location.origin
            : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          setInquiryUrl(`${baseUrl}/inquiry/${photographer.username}`)
        }
      } catch (error) {
        console.error("Error fetching inquiry URL:", error)
      }
    }

    fetchInquiryUrl()
  }, [supabase])

  const handleCopyInquiryLink = async () => {
    if (!inquiryUrl) {
      // Try to refresh the username in case it was just generated
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          const { data: photographer } = await supabase
            .from("photographers")
            .select("username")
            .eq("user_id", session.user.id)
            .single()

          if (photographer?.username) {
            const baseUrl = typeof window !== "undefined"
              ? window.location.origin
              : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            const url = `${baseUrl}/inquiry/${photographer.username}`
            setInquiryUrl(url)
            navigator.clipboard.writeText(url)
            setCopied(true)
            toast({
              title: "Link copied",
              description: "Your inquiry link has been copied to clipboard",
            })
            setTimeout(() => setCopied(false), 2000)
            return
          }
        }
      } catch (error) {
        console.error("Error refreshing username:", error)
      }

      // If still no username, show helpful error
      toast({
        title: "Username not found",
        description: "Your username should be auto-generated. If this persists, please refresh the page or set a username in settings.",
        variant: "destructive",
      })
      return
    }

    navigator.clipboard.writeText(inquiryUrl)
    setCopied(true)
    toast({
      title: "Link copied",
      description: "Your inquiry link has been copied to clipboard",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={handleCopyInquiryLink}
        variant="outline"
        className="flex items-center gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Inquiry Link
          </>
        )}
      </Button>
      <Link href="/bookings/new">
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </Link>
      <Link href="/contracts?generate=true">
        <Button variant="outline" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Generate AI Proposal
        </Button>
      </Link>
    </div>
  )
}

