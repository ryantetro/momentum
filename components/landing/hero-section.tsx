"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollAnimation } from "./scroll-animation"
import { MockDashboard } from "./mock-dashboard"

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 pt-8 md:pt-12 pb-20 md:pb-32 relative">
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollAnimation>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-normal sm:leading-normal md:leading-normal lg:leading-normal bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 pb-2">
              Stop Chasing Payments.
              <br />
              <span className="block mt-2">Start Shooting.</span>
            </h1>
          </ScrollAnimation>
          <ScrollAnimation delay={100}>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl md:text-2xl">
              The dedicated client management system for photographers. Zero monthly fees.
            </p>
          </ScrollAnimation>
          <ScrollAnimation delay={200}>
            <div className="mt-10 flex justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all bg-blue-600 hover:bg-blue-700 text-white border-0">
                  Try Free
                </Button>
              </Link>
            </div>
          </ScrollAnimation>
        </div>
        
        {/* Mock Dashboard Preview */}
        <MockDashboard />
      </div>
    </section>
  )
}

