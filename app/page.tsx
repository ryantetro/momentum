import { LandingHeader } from "@/components/landing/landing-header"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-blue-50/20 to-stone-50 relative">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]"></div>
      
      {/* Additional gradient accents with logo colors - alternating */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/40 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-t from-amber-50/40 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10">
        <LandingHeader />
        <main>
          <HeroSection />
          <FeaturesSection />
          <PricingSection />
          <TestimonialsSection />
          <HowItWorksSection />
        </main>
        <LandingFooter />
      </div>
    </div>
  )
}

