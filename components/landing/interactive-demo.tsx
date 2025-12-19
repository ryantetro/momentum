"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { LayoutDashboard, Users, Calendar, FileText, MousePointerClick } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { DemoDashboardView } from "./demo-dashboard-view"
import { DemoClientsView } from "./demo-clients-view"
import { DemoBookingsView } from "./demo-bookings-view"
import { DemoContractsView } from "./demo-contracts-view"
import { mockClients, mockBookings, mockStats } from "@/lib/mock-data"

type TabId = "dashboard" | "clients" | "bookings" | "contracts"

const tabs = [
  { id: "dashboard" as TabId, label: "Dashboard", icon: LayoutDashboard },
  { id: "clients" as TabId, label: "Clients", icon: Users },
  { id: "bookings" as TabId, label: "Bookings", icon: Calendar },
  { id: "contracts" as TabId, label: "Contracts", icon: FileText },
]

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
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

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DemoDashboardView
            totalClients={mockStats.totalClients}
            totalBookings={mockStats.totalBookings}
            pendingPayments={mockStats.pendingPayments}
            projectedRevenue={mockStats.projectedRevenue}
            bookings={mockBookings}
          />
        )
      case "clients":
        return <DemoClientsView clients={mockClients} />
      case "bookings":
        return <DemoBookingsView bookings={mockBookings} />
      case "contracts":
        return <DemoContractsView />
      default:
        return null
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        "mt-16 relative transition-all duration-1000 ease-out",
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-12 scale-95"
      )}
    >
      {/* Dashboard Container with shadow and border */}
      <div className="relative mx-auto max-w-5xl bg-background border-2 border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Browser-like top bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b"
        >
          <div className="flex gap-1.5">
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3 h-3 rounded-full bg-red-500 cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3 h-3 rounded-full bg-green-500 cursor-pointer"
            />
          </div>
          <div className="flex-1 mx-4 h-6 bg-background rounded border text-xs flex items-center px-3 text-muted-foreground">
            momentum.app/dashboard
          </div>
        </motion.div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-48 border-r bg-muted/30 p-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="flex items-center gap-2 mb-1 cursor-pointer"
              >
                <Image
                  src="/logowords.png"
                  alt="Momentum"
                  width={120}
                  height={35}
                  className="object-contain"
                />
              </motion.div>
            </motion.div>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all relative cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
                    )}
                    animate={
                      !isActive
                        ? {
                            opacity: [1, 0.7, 1],
                          }
                        : {}
                    }
                    transition={
                      !isActive
                        ? {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : { type: "spring", stiffness: 400, damping: 17 }
                    }
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary rounded-lg"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className={cn("h-4 w-4 relative z-10", isActive && "text-primary-foreground")} />
                    <span className="relative z-10">{tab.label}</span>
                  </motion.button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 min-h-[500px] max-h-[700px] overflow-y-auto relative">
            {/* Interactive hint - only show on dashboard */}
            {activeTab === "dashboard" && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm z-10"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  <MousePointerClick className="h-3 w-3" />
                </motion.div>
                <span>Click tabs to explore</span>
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-transparent to-amber-600/20 rounded-lg blur-xl -z-10"></div>
    </div>
  )
}

