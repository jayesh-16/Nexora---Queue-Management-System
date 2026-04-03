interface StatCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
  className?: string;
}

export function StatCard({ label, value, accent = false, className = "" }: StatCardProps) {
  return (
    <div className={`border border-border/40 p-6 ${className}`}>
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3">
        {label}
      </p>
      <p
        className={`font-[var(--font-bebas)] text-4xl tracking-tight ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
