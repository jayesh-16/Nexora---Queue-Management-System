"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Reusable Page Header ──────────────────────────────────────────────────────

interface NavLink {
  href: string;
  label: string;
}

interface PageHeaderProps {
  label: string;          // small mono label above title e.g. "Operator"
  title: string;          // large Bebas Neue title e.g. "DASHBOARD"
  links?: NavLink[];      // right-side nav links
}

export function PageHeader({ label, title, links = [] }: PageHeaderProps) {
  return (
    <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 md:px-16 py-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {label}
          </p>
          <h1 className="font-[var(--font-bebas)] text-4xl tracking-tight mt-0.5">
            {title}
          </h1>
        </div>
        {links.length > 0 && (
          <nav className="flex items-center gap-5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors duration-200"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

// ── Side Nav (landing page) ───────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "hero",       label: "Nexora" },
  { id: "features",   label: "Features" },
  { id: "how",        label: "How It Works" },
  { id: "stack",      label: "Stack" },
];

export function SideNav() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { threshold: 0.3 }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed left-0 top-0 z-50 h-screen w-16 md:w-20 hidden md:flex flex-col justify-center border-r border-border/20 bg-background/70 backdrop-blur-sm">
      <div className="flex flex-col gap-6 px-4">
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="group relative flex items-center gap-3"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                active === id
                  ? "bg-accent scale-125"
                  : "bg-muted-foreground/40 group-hover:bg-foreground/60"
              }`}
            />
            <span
              className={`absolute left-6 font-mono text-[10px] uppercase tracking-widest opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:left-8 whitespace-nowrap ${
                active === id ? "text-accent" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
