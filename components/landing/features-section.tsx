"use client"

import { FileText, CreditCard, Users } from "lucide-react"
import { ScrollAnimation } from "./scroll-animation"

const features = [
  {
    icon: CreditCard,
    title: "Automated Milestones",
    description: "Set it and forget it. Automated payment reminders save you hours of chasing clients. Focus on what you do best—capturing moments.",
    stat: "5+",
    statLabel: "hours saved per booking",
  },
  {
    icon: FileText,
    title: "Iron-Clad Contracts",
    description: "Professional contracts generated in seconds. E-signature integration means no more printing, scanning, or lost paperwork. Simplified and secure.",
    stat: "100%",
    statLabel: "digital workflow",
  },
  {
    icon: Users,
    title: "Centralized Client Portal",
    description: "One place for everything. Clients access contracts, make payments, and submit timelines—all in one branded portal. Time-saving and professional.",
    stat: "24/7",
    statLabel: "client access",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="container mx-auto px-4 py-20 md:py-32 relative">
      <div className="mx-auto max-w-6xl">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Streamline your photography business with our all-in-one platform
            </p>
          </div>
        </ScrollAnimation>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const glowColors = [
              "from-blue-500/30 to-blue-400/20",
              "from-amber-500/30 to-amber-400/20",
              "from-blue-500/30 to-blue-400/20",
            ]
            const iconBgColors = [
              "bg-blue-600",
              "bg-amber-500",
              "bg-blue-600",
            ]
            return (
              <ScrollAnimation key={feature.title} delay={index * 100}>
                <div className="text-center">
                {/* Icon with glow effect */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${glowColors[index]} blur-xl opacity-60`}></div>
                    <div className={`relative flex h-20 w-20 items-center justify-center rounded-full ${iconBgColors[index]}`}>
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Stat number */}
                <div className="mb-3">
                  <div className="text-5xl font-bold tracking-tight text-foreground">
                    {feature.stat}
                  </div>
                </div>
                
                {/* Stat label */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground font-medium">
                    {feature.statLabel}
                  </p>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                </div>
              </ScrollAnimation>
            )
          })}
        </div>
      </div>
    </section>
  )
}

