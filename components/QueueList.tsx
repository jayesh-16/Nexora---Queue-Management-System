/**
 * QueueList — Scrollable token list with status pills
 *
 * Displays all tokens for the active session with status, time, and optional actions.
 */

"use client";

import StatusPill from "./StatusPill";

export interface QueueItem {
  id: string;
  token_number: number;
  status: string;
  issued_at: string;
  called_at: string | null;
  served_at: string | null;
}

interface QueueListProps {
  tokens: QueueItem[];
  currentServing: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWaitTime(issued: string, called: string | null): string {
  if (!called) {
    const diffMs = Date.now() - new Date(issued).getTime();
    const mins = Math.floor(diffMs / 60000);
    return mins > 0 ? `${mins}m waiting` : "Just joined";
  }
  const diffMs = new Date(called).getTime() - new Date(issued).getTime();
  const mins = Math.round(diffMs / 60000);
  return `${mins}m wait`;
}

export default function QueueList({ tokens, currentServing }: QueueListProps) {
  if (tokens.length === 0) {
    return (
      <div className="border border-border/40 p-8 text-center bg-secondary/5">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">No tokens issued yet</p>
        <p className="font-mono text-[9px] text-muted-foreground/50 mt-2 uppercase tracking-widest">Tokens will appear here when customers join</p>
      </div>
    );
  }

  return (
    <div className="border border-border/40 max-h-[480px] overflow-y-auto divide-y divide-border/20">
      {tokens.map((token) => {
        const isCurrent = token.token_number === currentServing;
        return (
          <div
            key={token.id}
            className={`flex items-center gap-4 px-4 py-3 transition-colors ${
              isCurrent ? "bg-accent/10" : "hover:bg-secondary/5"
            }`}
          >
            {/* Token # */}
            <div
              className={`w-10 h-10 flex items-center justify-center font-[var(--font-bebas)] text-2xl flex-shrink-0 ${
                isCurrent
                  ? "bg-accent text-accent-foreground"
                  : token.status === "waiting"
                    ? "border border-border/40 text-muted-foreground"
                    : token.status === "called"
                      ? "border border-accent text-accent"
                      : "border border-border/20 text-muted-foreground/30"
              }`}
            >
              {token.token_number}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-mono text-xs uppercase tracking-widest ${isCurrent ? "text-accent" : "text-foreground"}`}>
                  Token #{token.token_number}
                </p>
                {isCurrent && (
                  <span className="text-[9px] font-mono tracking-widest text-accent-foreground bg-accent px-1.5 py-0.5">
                    NOW
                  </span>
                )}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">
                {formatTime(token.issued_at)} · {getWaitTime(token.issued_at, token.called_at)}
              </p>
            </div>

            {/* Status */}
            <StatusPill status={token.status} />
          </div>
        );
      })}
    </div>
  );
}
