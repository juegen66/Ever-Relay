import { FeaturesSection } from "@/components/landing/features-section"
import { Footer } from "@/components/landing/footer"
import { HeroSection } from "@/components/landing/hero-section"
import { Navbar } from "@/components/landing/navbar"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#faf8f5]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </main>
  )
}
