/**
 * Status Pill — coloured badge for token status
 */

const pillStyles: Record<string, string> = {
  waiting: "border border-border/50 text-muted-foreground",
  called: "border border-accent text-accent animate-pulse",
  served: "border border-border/20 text-muted-foreground/30",
  dropped: "border border-red-900 text-red-500/80",
};

interface StatusPillProps {
  status: string;
}

export default function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-[9px] font-mono uppercase tracking-widest ${
        pillStyles[status] ?? pillStyles.waiting
      }`}
    >
      {status}
    </span>
  );
}
