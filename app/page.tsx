import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { RegisterSection } from "@/components/landing/register-section"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d0d15 50%, #0a0a0f 100%)" }}
    >
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <RegisterSection />
      <Footer />
    </main>
  )
}
