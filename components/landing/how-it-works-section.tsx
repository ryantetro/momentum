"use client"

import { Calendar, Send, DollarSign, ArrowRight } from "lucide-react"
import { ScrollAnimation } from "./scroll-animation"

const steps = [
  {
    number: "1",
    icon: Calendar,
    title: "Create Booking",
    description: "Set up your booking with contract template and payment milestones",
    glowColor: "from-blue-500/30 to-blue-400/20",
    iconBg: "bg-blue-600",
  },
  {
    number: "2",
    icon: Send,
    title: "Send Portal Link",
    description: "Client receives secure portal access to view and sign contracts",
    glowColor: "from-amber-500/30 to-amber-400/20",
    iconBg: "bg-amber-500",
  },
  {
    number: "3",
    icon: DollarSign,
    title: "Get Paid",
    description: "Client signs contract and pays automatically through the portal",
    glowColor: "from-blue-500/30 to-blue-400/20",
    iconBg: "bg-blue-600",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="container mx-auto px-4 py-20 md:py-32 relative">
      <div className="mx-auto max-w-6xl">
        <ScrollAnimation>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>
        </ScrollAnimation>
        
        <div className="relative">
          {/* Horizontal flow container - centered */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <>
                  {/* Step content */}
                  <ScrollAnimation key={step.number} delay={index * 150}>
                    <div className="flex flex-col items-center text-center w-full md:w-auto max-w-xs">
                    {/* Icon with number badge */}
                    <div className="relative mb-6">
                      {/* Glow effect */}
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.glowColor} blur-xl opacity-50`}></div>
                      {/* Icon circle */}
                      <div className={`relative flex h-24 w-24 items-center justify-center rounded-full ${step.iconBg} shadow-lg`}>
                        <Icon className="h-12 w-12 text-white" />
                        {/* Number badge */}
                        <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-foreground font-bold text-sm shadow-md border-2 border-background">
                          {step.number}
                        </div>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-semibold mb-3">
                      {step.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    </div>
                  </ScrollAnimation>
                  
                  {/* Arrow connector (hidden on last item) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex items-center justify-center flex-shrink-0">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="h-px w-12 bg-gradient-to-r from-border to-transparent"></div>
                        <ArrowRight className="h-5 w-5" />
                        <div className="h-px w-12 bg-gradient-to-l from-border to-transparent"></div>
                      </div>
                    </div>
                  )}
                </>
              )
            })}
          </div>
          
          {/* Mobile vertical connector lines */}
          <div className="md:hidden flex flex-col items-center gap-4 mt-8">
            {steps.slice(0, -1).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

