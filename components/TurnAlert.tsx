/**
 * Turn Alert — Full-screen alert when customer's turn arrives
 *
 * Transforms the tracking page: red background, pulsing token,
 * vibration pattern, and delayed "I'm on my way" button.
 */

"use client";

import { useEffect, useRef, useState } from "react";

interface TurnAlertProps {
  tokenNumber: number;
  onAcknowledge?: () => void;
}

export default function TurnAlert({ tokenNumber, onAcknowledge }: TurnAlertProps) {
  const [showButton, setShowButton] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Vibrate device
    if ("vibrate" in navigator) {
      navigator.vibrate([400, 100, 400, 100, 400]);
    }

    // Show button after 1s delay (prevent accidental dismiss)
    const timer = setTimeout(() => setShowButton(true), 1000);

    // Focus the alert for screen readers
    alertRef.current?.focus();

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={alertRef}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-50 bg-accent flex flex-col items-center justify-center
                 px-6 text-accent-foreground text-center animate-fade-in focus:outline-none"
    >
      <div className="grid-bg fixed inset-0 opacity-10 mix-blend-overlay" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center p-8 border border-accent-foreground/20">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-6 opacity-80">
          Your Turn
        </p>

        <p
          className="font-[var(--font-bebas)] text-[150px] leading-none tracking-tight animate-pulse mb-8"
          aria-label={`Token number ${tokenNumber}`}
        >
          #{tokenNumber}
        </p>

        <p className="font-mono text-xs uppercase tracking-widest mb-12 opacity-80">
          Please approach the counter
        </p>

        <div
          className={`transition-all duration-500 ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={onAcknowledge}
            className="border border-accent-foreground text-accent-foreground px-8 py-4
                       font-mono text-xs uppercase tracking-widest active:scale-95 transition-transform
                       hover:bg-accent-foreground/5 cursor-pointer"
          >
            I'm on my way →
          </button>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="assertive">
        Your turn has arrived! Token number {tokenNumber}. Please approach the counter now.
      </div>
    </div>
  );
}
