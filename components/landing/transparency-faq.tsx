"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollAnimation } from "./scroll-animation"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "Wait, is this really free for me?",
    answer: "Yes. Momentum charges $0 per month. We make money by adding a small technology fee to the client's checkout. You receive the full amount you invoiced.",
  },
  {
    question: "How do I get my money?",
    answer: "We use Stripe Connect (the same tech used by Lyft and Shopify). Your earnings are deposited directly into your linked bank account on a 2-day rolling basis.",
  },
  {
    question: "Is the contract legally binding?",
    answer: "Yes. Momentum captures the client's IP address, timestamp, and digital signature, creating a secure audit trail for every booking.",
  },
]

export function TransparencyFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="container mx-auto px-4 py-20 md:py-32 relative">
      <div className="mx-auto max-w-4xl">
        <ScrollAnimation>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              Transparency
            </h2>
            <p className="text-lg text-muted-foreground">
              Common questions about how Momentum works
            </p>
          </div>
        </ScrollAnimation>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <ScrollAnimation key={index} delay={index * 100}>
              <Card
                className="cursor-pointer hover:border-blue-600/50 transition-colors"
                onClick={() => toggleFAQ(index)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </CardHeader>
                {openIndex === index && (
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  )
}

