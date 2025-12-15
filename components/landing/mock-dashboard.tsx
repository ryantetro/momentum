"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Users, Calendar, DollarSign, LayoutDashboard, FileText } from "lucide-react"

export function MockDashboard() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <div 
      ref={ref}
      className={`mt-16 relative transition-all duration-1000 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-12 scale-95"
      }`}
    >
      {/* Dashboard Container with shadow and border */}
      <div className="relative mx-auto max-w-5xl bg-background border-2 border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Browser-like top bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 mx-4 h-6 bg-background rounded border text-xs flex items-center px-3 text-muted-foreground">
            momentum.app/dashboard
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-48 border-r bg-muted/30 p-4">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Image
                  src="/logowords.png"
                  alt="Momentum"
                  width={120}
                  height={35}
                  className="object-contain"
                />
              </div>
            </div>
            <nav className="space-y-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground text-sm hover:bg-accent">
                <Users className="h-4 w-4" />
                Clients
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground text-sm hover:bg-accent">
                <Calendar className="h-4 w-4" />
                Bookings
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground text-sm hover:bg-accent">
                <FileText className="h-4 w-4" />
                Contracts
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Overview of your photography business</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Total Clients</span>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground mt-1">Active clients</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Total Bookings</span>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-muted-foreground mt-1">All bookings</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Pending Payments</span>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">$12,500</div>
                <p className="text-xs text-muted-foreground mt-1">Outstanding amount</p>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-card border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Recent Bookings</h3>
              </div>
              <div className="divide-y">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sarah & John Wedding</div>
                    <div className="text-sm text-muted-foreground">June 15, 2024</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$5,000</div>
                    <div className="text-xs text-muted-foreground">Deposit Paid</div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Family Portrait Session</div>
                    <div className="text-sm text-muted-foreground">May 28, 2024</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$850</div>
                    <div className="text-xs text-muted-foreground">Full Paid</div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Engagement Session</div>
                    <div className="text-sm text-muted-foreground">May 20, 2024</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">$600</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-transparent to-amber-600/20 rounded-lg blur-xl -z-10"></div>
    </div>
  )
}

