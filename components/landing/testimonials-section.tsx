"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"
import { ScrollAnimation } from "./scroll-animation"

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="container mx-auto px-4 py-20 md:py-32 bg-muted/30">
      <div className="mx-auto max-w-4xl">
        <ScrollAnimation>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              What Photographers Are Saying
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join photographers who are saving time and getting paid faster
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid gap-6 md:grid-cols-2">
          <ScrollAnimation delay={100}>
            <Card className="border-2">
            <CardContent className="p-6">
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-lg mb-4 italic">
                "Momentum saved me 5 hours of admin per wedding! No more chasing payments or lost contracts."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">SW</span>
                </div>
                <div>
                  <p className="font-semibold">Sarah Williams</p>
                  <p className="text-sm text-muted-foreground">Wedding Photographer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </ScrollAnimation>

          <ScrollAnimation delay={200}>
            <Card className="border-2">
            <CardContent className="p-6">
              <Quote className="h-8 w-8 text-primary mb-4" />
              <p className="text-lg mb-4 italic">
                "The automated reminders are a game-changer. I finally have time to focus on my craft instead of paperwork."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">MJ</span>
                </div>
                <div>
                  <p className="font-semibold">Michael Johnson</p>
                  <p className="text-sm text-muted-foreground">Portrait Photographer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  )
}

