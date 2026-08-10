import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import PromptTool from '@/components/PromptTool'
import OfferSection from '@/components/OfferSection'
import FaqSection from '@/components/FaqSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-[100dvh]">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <PromptTool />
        <OfferSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  )
}
