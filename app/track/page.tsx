"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getQueueStats, getSession, subscribeToTokenChanges } from "@/lib/supabase";
import type { Session } from "@/lib/supabase";
import TurnAlert from "@/components/TurnAlert";
import OfflineBanner from "@/components/OfflineBanner";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

function TrackPageContent() {
  const searchParams = useSearchParams();
  const tokenNumber = Number(searchParams.get("token")) || 0;
  const sessionId = searchParams.get("session") || "";

  const [session, setSession] = useState<Session | null>(null);
  const [nowServing, setNowServing] = useState(0);
  const [avgWait, setAvgWait] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showTurnAlert, setShowTurnAlert] = useState(false);
  const [isServed, setIsServed] = useState(false);
  const prevAhead = useRef<number>(999);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [sess, stats] = await Promise.all([getSession(sessionId), getQueueStats(sessionId)]);
      setSession(sess);
      setNowServing(stats.nowServing);
      setAvgWait(stats.avgWaitMins);
      setLastUpdated(new Date());
      setIsConnected(true);
      const currentAhead = tokenNumber - stats.nowServing;
      if (currentAhead <= 0 && prevAhead.current > 0) setShowTurnAlert(true);
      prevAhead.current = currentAhead;
    } catch {
      setIsConnected(false);
    }
  }, [sessionId, tokenNumber]);

  useEffect(() => {
    loadData();
    if (!sessionId) return;
    const unsub = subscribeToTokenChanges(sessionId, loadData);
    const interval = setInterval(loadData, 10000);
    return () => { unsub(); clearInterval(interval); };
  }, [loadData, sessionId]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  const ahead = Math.max(0, tokenNumber - nowServing);
  const estWait = avgWait > 0 ? Math.round(ahead * avgWait) : ahead * 3;
  const progressPercent = nowServing > 0 ? Math.min(100, (nowServing / (tokenNumber || 1)) * 100) : 0;

  if (!tokenNumber || !sessionId) {
    return (
      <main className="relative min-h-screen bg-background">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <div className="w-full max-w-md border border-border/40 p-8 text-center">
            <p className="font-[var(--font-bebas)] text-3xl tracking-tight mb-4">Token Not Found</p>
            <p className="font-mono text-sm text-muted-foreground mb-8">This token may have already been served.</p>
            <Link href="/scan" className="block font-mono text-xs uppercase tracking-widest border border-foreground/20 py-3 px-4 hover:border-accent hover:text-accent transition-all duration-200 text-center">
              Scan Again
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (showTurnAlert) {
    return <TurnAlert tokenNumber={tokenNumber} onAcknowledge={() => { setShowTurnAlert(false); setIsServed(true); }} />;
  }

  if (isServed) {
    return (
      <main className="relative min-h-screen bg-background">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
          <div className="border border-accent/50 p-12 text-center w-full max-w-md">
            <div className="font-[var(--font-bebas)] text-8xl text-accent mb-4">✓</div>
            <h1 className="font-[var(--font-bebas)] text-4xl tracking-tight mb-2">ALL DONE</h1>
            <p className="font-mono text-sm text-muted-foreground mb-8">Token #{tokenNumber} has been served. Thank you.</p>
            <Link href="/" className="block font-mono text-xs uppercase tracking-widest border border-foreground/20 py-3 px-4 hover:border-accent hover:text-accent transition-all duration-200 text-center">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
      <div className="relative z-10">
        {!isConnected && <OfflineBanner lastUpdated={lastUpdated} />}

        <PageHeader label="Track Queue" title="LIVE POSITION" links={[{ href: "/scan", label: "Back" }]} />

        <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6 md:px-12 py-12">
          <div className="w-full max-w-2xl space-y-4">
            {/* Token number */}
            <div className="border border-border/40 p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Your Token</p>
              <div
                className={`font-[var(--font-bebas)] text-7xl tracking-tight mb-2 transition-colors duration-700 ${
                  ahead === 0 ? "text-accent" : ahead <= 3 ? "text-yellow-400" : "text-foreground"
                }`}
              >
                #{tokenNumber}
              </div>
              <p className="font-mono text-xs text-muted-foreground">{session?.name}</p>
            </div>

            {/* Progress bar */}
            <div className="border border-border/40 p-6">
              <div className="flex justify-between items-center mb-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Progress</p>
                <p className="font-mono text-xs text-accent">{progressPercent.toFixed(0)}%</p>
              </div>
              <div className="w-full h-1.5 bg-secondary/20 border border-border/40">
                <div
                  className="h-full bg-accent transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-px bg-border/40">
              <div className="bg-background p-5">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Now Serving</p>
                <p className="font-[var(--font-bebas)] text-3xl tracking-tight text-accent">#{nowServing}</p>
              </div>
              <div className="bg-background p-5">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Your Position</p>
                <p className="font-[var(--font-bebas)] text-3xl tracking-tight">{ahead}</p>
              </div>
              <div className="bg-background p-5">
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Est. Wait</p>
                <p className="font-[var(--font-bebas)] text-3xl tracking-tight">
                  {ahead <= 0 ? "Now!" : `~${estWait}m`}
                </p>
              </div>
            </div>

            {/* Status message */}
            <div className="border border-border/40 p-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Status</p>
              <p className="font-mono text-sm">
                {ahead <= 0 ? (
                  <span className="text-accent">You&apos;re up next! Please proceed to the counter.</span>
                ) : ahead <= 2 ? (
                  <span className="text-yellow-400">Almost your turn — {ahead} person{ahead > 1 ? "s" : ""} ahead.</span>
                ) : (
                  <span className="text-muted-foreground">You have {ahead} people ahead of you. You can leave and we&apos;ll notify you.</span>
                )}
              </p>
            </div>

            {/* SR live region */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {`Now serving ${nowServing}. You are ${ahead} positions ahead. Estimated wait ${estWait} minutes.`}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen bg-background">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <p className="font-mono text-xs text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </main>
    }>
      <TrackPageContent />
    </Suspense>
  );
}
