/**
 * Offline Banner — shown when MQTT disconnects
 *
 * Displays at the top of the tracking page with last-known timestamp.
 */

"use client";

interface OfflineBannerProps {
  lastUpdated?: Date;
}

export default function OfflineBanner({ lastUpdated }: OfflineBannerProps) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="bg-accent/10 border-b border-accent/40 px-4 py-3
                    flex items-center justify-center gap-3 text-accent font-mono text-[9px] uppercase tracking-widest">
      <span className="w-1.5 h-1.5 rounded-none bg-accent flex-shrink-0 animate-pulse" />
      <span>
        Reconnecting — displaying last known position
        {timeStr && <span className="opacity-60 ml-2">[{timeStr}]</span>}
      </span>
    </div>
  );
}
