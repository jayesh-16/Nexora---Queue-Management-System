import { HeroSection } from "@/components/hero-section"
import { SignalsSection } from "@/components/signals-section"
import { WorkSection } from "@/components/work-section"
import { PrinciplesSection } from "@/components/principles-section"
import { ColophonSection } from "@/components/colophon-section"
import { SideNav } from "@/components/side-nav"

export default function Page() {
  return (
    <main className="relative min-h-screen">
      <SideNav />
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      {/* Demo Link - Top Right */}
      <a
        href="/scan"
        className="fixed top-6 right-6 z-40 font-mono text-xs uppercase tracking-widest text-accent hover:text-accent/80 transition-colors border border-accent/40 hover:border-accent px-4 py-2 bg-background/50 backdrop-blur-sm"
      >
        Join Queue →
      </a>

      <div className="relative z-10">
        <HeroSection />
        <SignalsSection />
        <WorkSection />
        <PrinciplesSection />
        <ColophonSection />
      </div>
    </main>
  )
}
