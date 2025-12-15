"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText,
  Settings,
  LogOut 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Bookings", href: "/bookings", icon: Calendar },
  { name: "Contracts", href: "/contracts", icon: FileText },
  { name: "Settings", href: "/settings/contract", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const router = useRouter()

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
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
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

