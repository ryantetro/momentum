"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText,
  Settings,
  LogOut,
  Link2,
  Copy,
  ExternalLink,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getInquiryUrl, getShortenedUrl, copyInquiryLink } from "@/lib/inquiry-link"
import { useToast } from "@/components/ui/toaster"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Bookings", href: "/bookings", icon: Calendar },
  { name: "Contracts", href: "/contracts", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [inquiryUrl, setInquiryUrl] = useState<string | null>(null)
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    async function fetchUsername() {
      if (!user) return

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
          setUsername(photographer.username)
          const url = getInquiryUrl(photographer.username)
          const short = getShortenedUrl(photographer.username)
          setInquiryUrl(url)
          setShortenedUrl(short)
        }
      } catch (error) {
        console.error("Error fetching username:", error)
      }
    }

    fetchUsername()
  }, [user, supabase])

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
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <>
      <div className="hidden md:flex h-full w-64 flex-col border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <Image
            src="/logowords.png"
            alt="Momentum"
            width={140}
            height={40}
            className="object-contain"
          />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
          {navigation.map((item) => {
            // Special handling for settings to match /settings/* routes
            const isActive = item.href === "/settings"
              ? pathname?.startsWith("/settings")
              : pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        {/* Quick Links Section */}
        {username && inquiryUrl && (
          <div className="border-t px-3 py-4">
            <div className="mb-2 px-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Your Public Link
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border">
                <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-foreground truncate flex-1 min-w-0">
                  {shortenedUrl}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="p-1 rounded hover:bg-accent transition-colors"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={handleViewPage}
                    className="p-1 rounded hover:bg-accent transition-colors"
                    title="View page"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Sign Out
          </Button>
        </div>
      </div>
      {/* Mobile menu would go here */}
    </>
  )
}

