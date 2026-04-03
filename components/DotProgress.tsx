/**
 * Dot Progress Indicator
 *
 * Shows up to 10 dots representing queue position.
 * Filled dots = people already served, empty = ahead of customer.
 * Color transitions: blue (>3) → amber (1-3) → red (0).
 */

"use client";

interface DotProgressProps {
  ahead: number;
  maxDots?: number;
}

export default function DotProgress({ ahead, maxDots = 10 }: DotProgressProps) {
  const filled = Math.max(0, maxDots - ahead);

  const dotColor =
    ahead > 3
      ? "bg-queue-waiting"
      : ahead >= 1
        ? "bg-queue-soon"
        : "bg-queue-now";

  const emptyColor = "bg-gray-200";

  return (
    <div className="flex items-center gap-1.5 mt-3">
      {Array.from({ length: maxDots }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
            i < filled ? `${dotColor} animate-dot-fill` : emptyColor
          }`}
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
      {ahead > maxDots && (
        <span className="text-xs text-gray-400 ml-1">{ahead - maxDots}+</span>
      )}
    </div>
  );
}
