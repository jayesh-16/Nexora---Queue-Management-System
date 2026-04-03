/**
 * CallNextButton — Large operator CTA to advance the queue
 *
 * Features:
 * - 1.5s cooldown between presses (prevents double-tap)
 * - Visual countdown indicator
 * - Disabled state when no tokens are waiting
 */

"use client";

import { useState, useRef, useCallback } from "react";

interface CallNextButtonProps {
  onCallNext: () => Promise<void>;
  disabled?: boolean;
  waitingCount: number;
}

export default function CallNextButton({
  onCallNext,
  disabled = false,
  waitingCount,
}: CallNextButtonProps) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePress = useCallback(async () => {
    if (loading || cooldown || disabled) return;

    setLoading(true);
    try {
      await onCallNext();
    } catch (err) {
      console.error("[CallNext] Error:", err);
    } finally {
      setLoading(false);
      setCooldown(true);
      cooldownTimer.current = setTimeout(() => setCooldown(false), 1500);
    }
  }, [loading, cooldown, disabled, onCallNext]);

  const isDisabled = disabled || loading || cooldown || waitingCount === 0;

  return (
    <button
      onClick={handlePress}
      disabled={isDisabled}
      className={`w-full py-4 px-4 font-mono text-xs uppercase tracking-widest transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 select-none
                  ${
                    isDisabled
                      ? "border border-border/20 text-muted-foreground/30 cursor-not-allowed"
                      : "text-foreground border border-foreground/20 hover:border-accent hover:text-accent"
                  }`}
    >
      {loading ? (
        <>
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Calling...
        </>
      ) : cooldown ? (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Called
        </>
      ) : waitingCount === 0 ? (
        "No one in queue"
      ) : (
        <>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.69z" />
          </svg>
          Call Next ({waitingCount} waiting)
        </>
      )}
    </button>
  );
}
