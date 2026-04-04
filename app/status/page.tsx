"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { getQueueStats, getActiveSession, subscribeToTokenChanges } from "@/lib/supabase";
import type { Session } from "@/lib/supabase";
import OfflineBanner from "@/components/OfflineBanner";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { mqttSubscribe } from "@/lib/mqtt";

function StatusPageContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [nowServing, setNowServing] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const [avgWait, setAvgWait] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [pageState, setPageState] = useState<"loading" | "ready" | "offline">("loading");

  const loadData = useCallback(async (currentSessionId?: string) => {
    try {
      let activeSessionId = currentSessionId;
      let sess = session;

      // If we don't know the active session yet, find it
      if (!activeSessionId) {
        const activeSess = await getActiveSession();
        if (!activeSess) {
          setPageState("offline");
          return;
        }
        activeSessionId = activeSess.id;
        sess = activeSess;
        setSession(activeSess);
      }

      if (!activeSessionId) return;

      const stats = await getQueueStats(activeSessionId);
      setNowServing(stats.nowServing);
      setWaitingCount(stats.waitingCount);
      setAvgWait(stats.avgWaitMins);
      setLastUpdated(new Date());
      setIsConnected(true);
      setPageState("ready");
    } catch {
      setIsConnected(false);
    }
  }, [session]);

  useEffect(() => {
    // Initial load
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!session?.id) return;
    
    // Subscribe to DB real-time changes
    const unsubDb = subscribeToTokenChanges(session.id, () => loadData(session.id));
    
    // Subscribe natively to hardware for instant 0-latency updates
    const unsubMqttC = mqttSubscribe("nexora/site01/queue/current", (p: any) => { if (typeof p.current === "number") setNowServing(p.current); });
    const unsubMqttL = mqttSubscribe("nexora/site01/queue/length", (p: any) => { if (typeof p.length === "number") setWaitingCount(p.length); });

    // Fallback polling
    const interval = setInterval(() => loadData(session.id), 10000);
    
    return () => { 
      unsubDb(); 
      unsubMqttC();
      unsubMqttL();
      clearInterval(interval); 
    };
  }, [loadData, session?.id]);

  if (pageState === "loading") {
    return (
      <main className="relative min-h-screen bg-background flex flex-col">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <p className="font-mono text-xs text-muted-foreground animate-pulse tracking-widest uppercase">
            Fetching Queue Status...
          </p>
        </div>
      </main>
    );
  }

  if (pageState === "offline") {
    return (
      <main className="relative min-h-screen bg-background flex flex-col">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="relative z-10 flex-1 flex flex-col">
          <PageHeader label="Live Status" title="NEXORA" links={[{ href: "/", label: "Home" }]} />
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="w-full max-w-sm border border-border/40 p-8 text-center bg-secondary/5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Unavailable</p>
              <h2 className="font-[var(--font-bebas)] text-3xl tracking-tight mb-2">QUEUE OFFLINE</h2>
              <p className="font-mono text-xs text-muted-foreground mb-8">
                The operator has not opened the counter yet. Please check back later.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background flex flex-col">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
      <div className="relative z-10 flex-1 flex flex-col">
        {!isConnected && <OfflineBanner lastUpdated={lastUpdated} />}

        <PageHeader label="Live Status" title="GLOBAL QUEUE" links={[{ href: "/", label: "Home" }]} />

        <div className="flex flex-1 items-center justify-center px-4 sm:px-6 py-8">
          <div className="w-full max-w-lg space-y-4">
            
            {/* Header info */}
            <div className="border border-border/40 p-8 bg-secondary/5 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                Currently Active Session
              </p>
              <h1 className="font-[var(--font-bebas)] text-5xl tracking-tight text-foreground leading-none mb-1">
                {session?.name}
              </h1>
              <p className="font-mono text-sm text-accent">{session?.category}</p>
            </div>

            {/* Huge Now Serving display */}
            <div className="border border-accent/40 bg-accent/5 p-12 text-center shadow-[0_0_30px_rgba(255,100,0,0.05)]">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
                Now Serving
              </p>
              <div className="font-[var(--font-bebas)] text-9xl tracking-tight text-accent leading-none">
                #{nowServing}
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-px bg-border/40">
              <div className="bg-background p-6 text-center hover:bg-secondary/5 transition-colors">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3">
                  People Waiting
                </p>
                <p className="font-[var(--font-bebas)] text-4xl tracking-tight text-foreground">
                   {waitingCount} <span className="text-xl">ppl</span>
                </p>
              </div>
              <div className="bg-background p-6 text-center hover:bg-secondary/5 transition-colors">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3">
                  Est. Wait Time
                </p>
                <p className="font-[var(--font-bebas)] text-4xl tracking-tight text-foreground">
                   ~{Math.round(waitingCount * avgWait)} <span className="text-xl">min</span>
                </p>
              </div>
            </div>

            {/* Call to action */}
            <div className="pt-4 flex gap-4">
              <Link 
                href="/join" 
                className="flex-1 bg-transparent border border-accent text-accent uppercase font-mono text-sm tracking-widest text-center py-4 hover:bg-accent hover:text-accent-foreground transition-all duration-200"
              >
                Join Queue
              </Link>
            </div>
            
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50 text-center pt-2">
              Values automatically update in real-time
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-background" />}>
      <StatusPageContent />
    </Suspense>
  );
}
