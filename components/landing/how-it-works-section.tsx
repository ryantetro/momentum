"use client"

import { CreditCard, Link2, Zap, ArrowRight } from "lucide-react"
import { ScrollAnimation } from "./scroll-animation"

const steps = [
  {
    number: "1",
    icon: CreditCard,
    title: "Connect Your Business",
    description: "Click 'Enable Payments' in your dashboard. You'll be redirected to our secure partner, Stripe, to link your bank account. Don't have a Stripe account? No problem—you can create one in under 2 minutes during the setup.",
    benefit: "Instant credibility and professional-grade security for your clients.",
    glowColor: "from-blue-500/30 to-blue-400/20",
    iconBg: "bg-blue-600",
  },
  {
    number: "2",
    icon: Link2,
    title: "Send a Momentum Link",
    description: "Instead of juggling three apps, just enter the shoot details and click 'Generate Proposal.' Send that one link to your client via email or DM.",
    benefit: "Your client sees a beautiful, branded portal where they can read your contract, e-sign, and see their payment schedule all in one place.",
    glowColor: "from-amber-500/30 to-amber-400/20",
    iconBg: "bg-amber-500",
  },
  {
    number: "3",
    icon: Zap,
    title: "Get Paid on Autopilot",
    description: "Once the client signs, Momentum automatically prompts them for the deposit. We handle the math, the reminders, and the transaction fees. The funds are split automatically: your 96.5% goes straight to your bank, and the small fee is added to the client's total.",
    benefit: "You get 100% of your requested service fee. No more 'losing' 3% to processing costs.",
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
              Three steps to total administrative freedom
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
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {step.description}
                    </p>
                    
                    {/* Benefit */}
                    {step.benefit && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          The Benefit: <span className="text-muted-foreground font-normal">{step.benefit}</span>
                        </p>
                      </div>
                    )}
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

