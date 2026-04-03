"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import HourlyChart from "@/components/HourlyChart";
import { PageHeader } from "@/components/page-header";

type Period = "today" | "week" | "month";

interface AnalyticsData {
  totalIssued: number;
  totalServed: number;
  totalDropped: number;
  avgWaitMins: number;
  hourlyData: { hour: string; tokens: number }[];
}

const PERIOD_LABELS: Record<Period, string> = { today: "Today", week: "This Week", month: "This Month" };

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [data, setData] = useState<AnalyticsData>({ totalIssued: 0, totalServed: 0, totalDropped: 0, avgWaitMins: 0, hourlyData: [] });
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const startDate =
      period === "today" ? now.toISOString().slice(0, 10) + "T00:00:00.000Z"
      : period === "week" ? new Date(now.getTime() - 7 * 86400000).toISOString()
      : new Date(now.getTime() - 30 * 86400000).toISOString();

    const { data: sessions } = await supabase.from("sessions").select("id").gte("started_at", startDate);
    const sessionIds = sessions?.map((s) => s.id) ?? [];

    if (sessionIds.length === 0) { setData({ totalIssued: 0, totalServed: 0, totalDropped: 0, avgWaitMins: 0, hourlyData: [] }); setLoading(false); return; }

    const { data: tokens } = await supabase.from("queue_tokens").select("status, issued_at, called_at").in("session_id", sessionIds);
    const all = tokens ?? [];

    const totalIssued = all.length;
    const totalServed = all.filter((t) => t.status === "served").length;
    const totalDropped = all.filter((t) => t.status === "dropped").length;

    const servedTokens = all.filter((t) => t.status === "served" && t.called_at);
    const avgWaitMins = servedTokens.length > 0
      ? Math.round(servedTokens.reduce((acc, t) => acc + (new Date(t.called_at!).getTime() - new Date(t.issued_at).getTime()), 0) / servedTokens.length / 60000)
      : 0;

    const hourBuckets: Record<string, number> = {};
    all.forEach((t) => {
      const h = new Date(t.issued_at).getHours();
      const label = h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
      hourBuckets[label] = (hourBuckets[label] ?? 0) + 1;
    });

    const hourlyData = Object.entries(hourBuckets).map(([hour, tokens]) => ({ hour, tokens }))
      .sort((a, b) => {
        const n = (h: string) => { const x = parseInt(h); return h.endsWith("pm") && x !== 12 ? x + 12 : h.endsWith("am") && x === 12 ? 0 : x; };
        return n(a.hour) - n(b.hour);
      });

    setData({ totalIssued, totalServed, totalDropped, avgWaitMins, hourlyData });
    setLoading(false);
  }, [period]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const dropRate = data.totalIssued > 0 ? Math.round((data.totalDropped / data.totalIssued) * 100) : 0;
  const efficiency = data.totalIssued > 0 ? Math.round((data.totalServed / data.totalIssued) * 100) : 0;
  const maxHourly = Math.max(...(data.hourlyData.map((h) => h.tokens)), 1);

  return (
    <main className="relative min-h-screen bg-background">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
      <div className="relative z-10">
        <PageHeader
          label="Performance"
          title="ANALYTICS"
          links={[{ href: "/dashboard", label: "Dashboard" }, { href: "/login", label: "Logout" }]}
        />

        <div className="px-6 md:px-16 py-10 space-y-4">
          {/* Period selector */}
          <div className="flex gap-px bg-border/40">
            {(["today", "week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-3 font-mono text-xs uppercase tracking-widest transition-all duration-150 ${
                  period === p ? "bg-accent/10 text-accent border border-accent" : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="border border-border/40 h-20 animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40">
                {[
                  { label: "Total Issued", value: data.totalIssued },
                  { label: "Served", value: data.totalServed },
                  { label: "Drop-off", value: `${dropRate}%` },
                  { label: "Avg Wait", value: data.avgWaitMins > 0 ? `${data.avgWaitMins}m` : "—", accent: true },
                ].map((s) => (
                  <div key={s.label} className="bg-background p-6">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">{s.label}</p>
                    <p className={`font-[var(--font-bebas)] text-4xl tracking-tight ${s.accent ? "text-accent" : ""}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Hourly chart */}
              <div className="border border-border/40 p-8">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Hourly Traffic</p>

                {data.hourlyData.length > 0 ? (
                  <div className="space-y-3">
                    {data.hourlyData.map((item) => (
                      <div key={item.hour}>
                        <div className="flex justify-between mb-1 font-mono text-xs">
                          <span className="text-muted-foreground">{item.hour}</span>
                          <span className="text-foreground">{item.tokens}</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary/20 border border-border/40">
                          <div
                            className="h-full bg-accent transition-all duration-500"
                            style={{ width: `${(item.tokens / maxHourly) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center">
                    <p className="font-mono text-xs text-muted-foreground">No data for this period</p>
                  </div>
                )}
              </div>

              {/* Performance grid */}
              <div className="grid grid-cols-2 gap-px bg-border/40">
                <div className="bg-background p-8">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Wait Times</p>
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Avg:</span><span className="text-accent">{data.avgWaitMins > 0 ? `${data.avgWaitMins} min` : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Served:</span><span>{data.totalServed}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Dropped:</span><span>{data.totalDropped}</span></div>
                  </div>
                </div>
                <div className="bg-background p-8">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Efficiency</p>
                  <p className="font-[var(--font-bebas)] text-5xl tracking-tight text-accent mb-3">{efficiency}%</p>
                  <div className="w-full h-1.5 bg-secondary/20 border border-border/40">
                    <div className="h-full bg-accent" style={{ width: `${efficiency}%` }} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
