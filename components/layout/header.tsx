"use client"

import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useRef } from "react"
import type { Photographer } from "@/types"
import { Button } from "@/components/ui/button"
import { Copy, Check, ChevronDown, ExternalLink, Link2 } from "lucide-react"
import { useToast } from "@/components/ui/toaster"
import { getInquiryUrl, copyInquiryLink } from "@/lib/inquiry-link"

export function Header() {
  const { user } = useAuth()
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [inquiryUrl, setInquiryUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      const supabase = createClient()
      supabase
        .from("photographers")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }: { data: Photographer | null }) => {
          if (data) {
            setPhotographer(data)
            const url = getInquiryUrl(data.username)
            setInquiryUrl(url)
          }
        })
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  const handleCopyLink = async () => {
    if (!inquiryUrl) {
      toast({
        title: "No inquiry link",
        description: "Your username is being generated. Please try again in a moment.",
        variant: "destructive",
      })
      return
    }

    try {
      await copyInquiryLink(inquiryUrl)
      setCopied(true)
      setDropdownOpen(false)
      toast({
        title: "Link copied",
        description: "Your inquiry link has been copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleViewPage = () => {
    if (!inquiryUrl) return
    window.open(inquiryUrl, "_blank", "noopener,noreferrer")
    setDropdownOpen(false)
  }

  // Extract first name from email
  const getFirstName = () => {
    if (!user?.email) return null
    const emailName = user.email.split("@")[0]
    // Split by common separators and take first part
    const firstName = emailName.split(/[._-]/)[0]
    // Capitalize first letter
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
  }

  const firstName = getFirstName()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">
          {photographer?.business_name || (firstName ? `Welcome ${firstName}` : "Welcome")}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {inquiryUrl && (
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Inquiry Link
                </>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </button>
                  <button
                    onClick={handleViewPage}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Live Page
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          {user?.email}
        </span>
      </div>
    </header>
  )
}

