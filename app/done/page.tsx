"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DonePage() {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-2xl">
          {/* Pulsing accent border behind card */}
          <div
            className={`absolute inset-0 border border-accent/30 transition-all duration-1000 ${
              pulse ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{ animation: pulse ? "done-pulse 2.5s ease-in-out infinite" : "none" }}
            aria-hidden="true"
          />

          <div className="relative border border-accent/50 p-10 md:p-14 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
              It&apos;s Your Turn
            </p>

            <div className="mb-8">
              <div className="font-[var(--font-bebas)] text-9xl tracking-tight text-accent mb-4 leading-none">
                ✓
              </div>
              <h1 className="font-[var(--font-bebas)] text-5xl md:text-6xl tracking-tight mb-2">
                PLEASE PROCEED
              </h1>
              <p className="font-mono text-sm text-muted-foreground">
                Counter A is ready for you
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-secondary/10 border border-border/40 p-6 mb-8 text-left">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                Instructions
              </p>
              <p className="font-mono text-sm text-foreground leading-relaxed">
                Head to Counter A immediately. Your token has been called.
                Please have your documents ready.
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="border border-border/40 p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Status</p>
                <p className="font-[var(--font-bebas)] text-2xl tracking-tight text-accent">Served</p>
              </div>
              <div className="border border-border/40 p-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Counter</p>
                <p className="font-[var(--font-bebas)] text-2xl tracking-tight">A</p>
              </div>
            </div>

            <Link
              href="/scan"
              className="block py-3 px-4 font-mono text-xs uppercase tracking-widest text-foreground border border-foreground/20 text-center hover:border-accent hover:text-accent transition-all duration-200"
            >
              Get New Token
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes done-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1.01); }
          50%       { opacity: 0.4;  transform: scale(1.03); }
        }
      `}</style>
    </main>
  );
}
