"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const experiments = [
  {
    title: "Smart Queue System",
    medium: "Nexora Platform",
    description: "Complete ecosystem for managing queues with hardware kiosks, real-time dashboard, and mobile tracking.",
    span: "col-span-2 row-span-2",
    featured: true,
  },
  {
    title: "Hardware Kiosks",
    medium: "ESP32 + OLED",
    description: "Physical button interface with dynamic QR code generation for paperless token issuance.",
    span: "col-span-1 row-span-1",
  },
  {
    title: "MQTT Broker",
    medium: "Real-time Sync",
    description: "Zero-lag pub/sub architecture connecting all devices with sub-150ms latency.",
    span: "col-span-2 row-span-1",
  },
  {
    title: "Live Dashboard",
    medium: "Web + Mobile",
    description: "Operator interface for queue management with live metrics and session tracking.",
    span: "col-span-1 row-span-2",
  },
  {
    title: "Customer Tracking",
    medium: "Mobile-First",
    description: "Real-time queue position updates with notifications when serving your token.",
    span: "col-span-1 row-span-1",
  },
  {
    title: "Analytics Engine",
    medium: "Supabase",
    description: "Historical data collection with wait times, traffic flow, and operator efficiency metrics.",
    span: "col-span-1 row-span-1",
  },
  {
    title: "React Native App",
    medium: "Cross-Platform",
    description: "Native mobile dashboard and customer tracking with offline queue support.",
    span: "col-span-1 row-span-1",
  },
]

export function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !headerRef.current || !gridRef.current) return

    const ctx = gsap.context(() => {
      // Header slide in from left
      gsap.fromTo(
        headerRef.current,
        { x: -60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        },
      )

      const cards = gridRef.current?.querySelectorAll("article")
      if (cards && cards.length > 0) {
        gsap.set(cards, { y: 60, opacity: 0 })
        gsap.to(cards, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="work" className="relative py-32 pl-6 md:pl-28 pr-6 md:pr-12">
      {/* Section header */}
      <div ref={headerRef} className="mb-16 flex items-end justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">02 / Features</span>
          <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">CORE SYSTEMS</h2>
        </div>
        <p className="hidden md:block max-w-xs font-mono text-xs text-muted-foreground text-right leading-relaxed">
          Integrated hardware, cloud infrastructure, and mobile applications for complete queue management.
        </p>
      </div>

      {/* Asymmetric grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[180px] md:auto-rows-[200px]"
      >
        {experiments.map((experiment, index) => (
          <WorkCard key={index} experiment={experiment} index={index} persistHover={index === 0} />
        ))}
      </div>
    </section>
  )
}

function WorkCard({
  experiment,
  index,
  persistHover = false,
}: {
  experiment: {
    title: string
    medium: string
    description: string
    span: string
    featured?: boolean
  }
  index: number
  persistHover?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLElement>(null)
  const [isScrollActive, setIsScrollActive] = useState(false)

  useEffect(() => {
    if (!persistHover || !cardRef.current) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: cardRef.current,
        start: "top 80%",
        onEnter: () => setIsScrollActive(true),
      })
    }, cardRef)

    return () => ctx.revert()
  }, [persistHover])

  const isActive = isHovered || isScrollActive

  // Featured card layout
  if (experiment.featured) {
    return (
      <article
        ref={cardRef}
        className={cn(
          "group relative border border-border/40 p-6 flex flex-col justify-between transition-all duration-500 cursor-pointer overflow-hidden",
          experiment.span,
          isActive && "border-accent/60",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background layer */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 transition-opacity duration-500",
            isActive ? "opacity-100" : "opacity-50",
          )}
        />

        {/* Visual Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#grid)" />
            <circle cx="200" cy="150" r="80" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <circle cx="200" cy="150" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <line x1="100" y1="0" x2="100" y2="300" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            <line x1="300" y1="0" x2="300" y2="300" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
            {experiment.medium}
          </span>
          <h3
            className={cn(
              "mt-4 font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight transition-colors duration-300",
              isActive ? "text-accent" : "text-foreground",
            )}
          >
            {experiment.title}
          </h3>
        </div>

        {/* Description */}
        <div className="relative z-10">
          <p
            className={cn(
              "font-mono text-xs text-muted-foreground leading-relaxed transition-all duration-500",
              isActive ? "opacity-100 translate-y-0" : "opacity-60 translate-y-0",
            )}
          >
            {experiment.description}
          </p>
        </div>

        {/* Index marker */}
        <span
          className={cn(
            "absolute bottom-6 right-6 font-mono text-[10px] transition-colors duration-300",
            isActive ? "text-accent" : "text-muted-foreground/40",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Corner line */}
        <div
          className={cn(
            "absolute top-0 right-0 w-12 h-12 transition-all duration-500",
            isActive ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="absolute top-0 right-0 w-full h-[1px] bg-accent" />
          <div className="absolute top-0 right-0 w-[1px] h-full bg-accent" />
        </div>
      </article>
    )
  }

  // Regular card layout
  return (
    <article
      ref={cardRef}
      className={cn(
        "group relative border border-border/40 p-5 flex flex-col justify-between transition-all duration-500 cursor-pointer overflow-hidden",
        experiment.span,
        isActive && "border-accent/60",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background layer */}
      <div
        className={cn(
          "absolute inset-0 bg-accent/5 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {experiment.medium}
        </span>
        <h3
          className={cn(
            "mt-3 font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight transition-colors duration-300",
            isActive ? "text-accent" : "text-foreground",
          )}
        >
          {experiment.title}
        </h3>
      </div>

      {/* Description - reveals on hover */}
      <div className="relative z-10">
        <p
          className={cn(
            "font-mono text-xs text-muted-foreground leading-relaxed transition-all duration-500 max-w-[280px]",
            isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
        >
          {experiment.description}
        </p>
      </div>

      {/* Index marker */}
      <span
        className={cn(
          "absolute bottom-4 right-4 font-mono text-[10px] transition-colors duration-300",
          isActive ? "text-accent" : "text-muted-foreground/40",
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Corner line */}
      <div
        className={cn(
          "absolute top-0 right-0 w-12 h-12 transition-all duration-500",
          isActive ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="absolute top-0 right-0 w-full h-[1px] bg-accent" />
        <div className="absolute top-0 right-0 w-[1px] h-full bg-accent" />
      </div>
    </article>
  )
}
