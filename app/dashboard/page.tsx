"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, getQueueStats, subscribeToTokenChanges } from "@/lib/supabase";
import { mqttSubscribe } from "@/lib/mqtt";
import QueueList from "@/components/QueueList";
import type { QueueItem } from "@/components/QueueList";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

interface ActiveSession {
  id: string;
  name: string;
  category: string;
  started_at: string;
  is_active: boolean;
}

export default function DashboardPage() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalIssued: 0, waitingCount: 0, servedCount: 0, nowServing: 0, avgWaitMins: 0 });
  const [tokens, setTokens] = useState<QueueItem[]>([]);

  const loadSession = useCallback(async () => {
    const { data } = await supabase
      .from("sessions").select("*").eq("is_active", true)
      .order("started_at", { ascending: false }).limit(1).maybeSingle();
    setSession(data);
    setLoading(false);
    return data;
  }, []);

  const refreshData = useCallback(async () => {
    if (!session?.id) return;
    const [statsData, tokensData] = await Promise.all([
      getQueueStats(session.id),
      supabase.from("queue_tokens").select("*").eq("session_id", session.id)
        .order("token_number", { ascending: false }).then((r) => r.data ?? []),
    ]);
    setStats(statsData);
    setTokens(tokensData as QueueItem[]);
  }, [session?.id]);

  useEffect(() => { loadSession(); }, [loadSession]);

  useEffect(() => {
    if (!session?.id) return;
    refreshData();
    const unsub = subscribeToTokenChanges(session.id, refreshData);
    const interval = setInterval(refreshData, 8000);
    
    // Hardware Box integration: The physical ESP32 box publishes the new current queue number here.
    // The web app acts as the bridge connecting the MQTT hardware action to the Supabase database.
    const unsubMqtt = mqttSubscribe("nexora/site01/queue/current", (payload: any) => {
      if (payload && typeof payload.current === "number") {
         console.log("[Hardware] Next button pressed on Box 1. Advancing database...");
         handleCallNext();
      }
    });

    return () => { unsub(); unsubMqtt(); clearInterval(interval); };
  }, [session?.id, refreshData]); // intentionally omitted handleCallNext to avoid re-bind loop, or we can use ref

  const handleCallNext = useCallback(async () => {
    if (!session?.id) return;
    const { data: nextToken } = await supabase.from("queue_tokens").select("id, token_number")
      .eq("session_id", session.id).eq("status", "waiting")
      .order("token_number", { ascending: true }).limit(1).single();
    if (!nextToken) return;
    await supabase.from("queue_tokens").update({ status: "served", served_at: new Date().toISOString() })
      .eq("session_id", session.id).eq("status", "called");
    await supabase.from("queue_tokens").update({ status: "called", called_at: new Date().toISOString() })
      .eq("id", nextToken.id);
    await refreshData();
  }, [session?.id, refreshData]);

  const handleEndSession = async () => {
    if (!session?.id) return;
    if (!confirm("End this queue session? All waiting tokens will be dropped.")) return;
    await supabase.from("queue_tokens").update({ status: "dropped" })
      .eq("session_id", session.id).eq("status", "waiting");
    await supabase.from("sessions").update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("id", session.id);
    setSession(null);
    await loadSession();
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="relative min-h-screen bg-background">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="relative z-10">
          <PageHeader label="Operator" title="DASHBOARD" links={[{ href: "/dashboard/analytics", label: "Analytics" }, { href: "/login", label: "Logout" }]} />
          <div className="px-6 md:px-16 py-12 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border/40 h-24 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── No Active Session ────────────────────────────────────────────
  if (!session) {
    return (
      <main className="relative min-h-screen bg-background">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="relative z-10">
          <PageHeader label="Operator" title="DASHBOARD" links={[{ href: "/login", label: "Logout" }]} />
          <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
            <div className="w-full max-w-md border border-border/40 p-10 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">No Active Session</p>
              <h2 className="font-[var(--font-bebas)] text-4xl tracking-tight mb-4">QUEUE OFFLINE</h2>
              <p className="font-mono text-sm text-muted-foreground mb-8 leading-relaxed">
                Start a new session to begin managing customers.
              </p>
              <Link
                href="/dashboard/new"
                className="block font-mono text-xs uppercase tracking-widest border border-foreground/20 py-3 px-4 hover:border-accent hover:text-accent transition-all duration-200 text-center"
              >
                Start New Session →
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Active Dashboard ─────────────────────────────────────────────
  const sessionTime = new Date(session.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="relative min-h-screen bg-background">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
      <div className="relative z-10">
        <PageHeader
          label="Operator"
          title="DASHBOARD"
          links={[
            { href: "/dashboard/analytics", label: "Analytics" },
            { href: "/login", label: "Logout" },
          ]}
        />

        <div className="px-6 md:px-16 py-10 space-y-4">
          {/* Session info */}
          <div className="border border-border/40 p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Active Session</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Counter</p>
                <p className="font-[var(--font-bebas)] text-3xl tracking-tight">{session.name || "Counter A"}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Department</p>
                <p className="font-mono text-sm text-foreground mt-1">{session.category}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Started</p>
                <p className="font-mono text-sm">{sessionTime}</p>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleEndSession}
                  className="font-mono text-[10px] uppercase tracking-widest text-red-400 border border-red-400/30 px-4 py-2 hover:border-red-400 hover:bg-red-400/5 transition-all duration-200"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40">
            <div className="bg-background p-6">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Now Serving</p>
              <p className="font-[var(--font-bebas)] text-4xl tracking-tight text-accent">
                {stats.nowServing > 0 ? `#${stats.nowServing}` : "—"}
              </p>
            </div>
            <div className="bg-background p-6">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">In Queue</p>
              <p className="font-[var(--font-bebas)] text-4xl tracking-tight">{stats.waitingCount}</p>
            </div>
            <div className="bg-background p-6">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Avg Wait</p>
              <p className="font-[var(--font-bebas)] text-4xl tracking-tight">
                {stats.avgWaitMins > 0 ? `~${stats.avgWaitMins}m` : "—"}
              </p>
            </div>
            <div className="bg-background p-6">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Served Today</p>
              <p className="font-[var(--font-bebas)] text-4xl tracking-tight">{stats.servedCount}</p>
            </div>
          </div>

          {/* Hardware Lock */}
          <div className="border border-border/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-secondary/5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Queue Control</p>
              <p className="font-mono text-xs uppercase tracking-widest text-foreground">Hardware Box Enforced</p>
            </div>
            <div className="px-4 py-3 border border-orange-500/30 bg-orange-500/5 text-orange-500 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 animate-pulse" />
              Awaiting Physical Button Press
            </div>
          </div>

          {/* Queue List */}
          <div className="border border-border/40 p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-5">Queue</p>
            <QueueList tokens={tokens} currentServing={stats.nowServing} />
          </div>
        </div>
      </div>
    </main>
  );
}
