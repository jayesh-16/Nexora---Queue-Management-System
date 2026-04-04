"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { mqttSubscribe, mqttPublish } from "@/lib/mqtt";

const CATEGORIES = [
  { id: "bank", label: "Bank" },
  { id: "hospital", label: "Hospital" },
  { id: "government", label: "Government" },
  { id: "clinic", label: "Clinic" },
  { id: "college", label: "College" },
  { id: "telecom", label: "Telecom" },
  { id: "post", label: "Post Office" },
  { id: "other", label: "Other" },
];

export default function NewSessionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hardwareOnline, setHardwareOnline] = useState(false);

  useEffect(() => {
    let lastPong = 0;

    // Listen for PONG responses from ESP32 Operator Box
    const unsub = mqttSubscribe("nexora/site01/hw/pong", (payload) => {
      const data = payload as { from?: string };
      if (data?.from === "box1") {
        lastPong = Date.now();
        setHardwareOnline(true);
      }
    });

    // Pinger loop every 2 seconds
    const pingTimer = setInterval(() => {
      mqttPublish("nexora/site01/hw/ping", { req: "status" });
      
      // If we haven't received a PONG for 5 seconds, set offline
      if (Date.now() - lastPong > 5000) {
        setHardwareOnline(false);
      }
    }, 2000);

    // Initial ping on mount after a slight delay for MQTT to connect
    setTimeout(() => mqttPublish("nexora/site01/hw/ping", { req: "init" }), 500);

    return () => {
      unsub();
      clearInterval(pingTimer);
    };
  }, []);

  const handleStart = async () => {
    if (!name.trim() || !category) { setError("Please fill in all fields"); return; }
    setLoading(true); setError("");
    try {
      await supabase.from("sessions").update({ is_active: false, ended_at: new Date().toISOString() }).eq("is_active", true);
      const { error: insertError } = await supabase.from("sessions").insert({
        name: name.trim(), category, is_active: true, token_counter: 0, env: "production"
      });
      if (insertError) throw insertError;
      
      // Broadcast to hardware that a new session has started
      mqttPublish("nexora/site01/day/start", { date: new Date().toISOString() });
      
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("[Session Error]", err);
      const msg = typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : "Could not create session";
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <main className="relative min-h-screen bg-background">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
      <div className="relative z-10">
        <PageHeader label="Setup" title="SESSION" links={[{ href: "/login", label: "Logout" }]} />

        <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6 md:px-12 py-12">
          <div className="w-full max-w-2xl space-y-4">
            {/* Form card */}
            <div className="border border-border/40 p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground object-contain">
                  Initialize Queue Session
                </p>

                {/* Hardware Status Indicator */}
                <div className={`font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border flex items-center gap-2 ${
                  hardwareOnline 
                    ? "border-accent/40 text-accent bg-accent/5 animate-pulse" 
                    : "border-red-900/50 text-red-500 bg-red-950/20"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-none ${hardwareOnline ? "bg-accent" : "bg-red-500"}`} />
                  {hardwareOnline ? "Box 1 Connected" : "HW Disconnected"}
                </div>
              </div>

              <div className="space-y-6">
                {/* Session Name */}
                <div>
                  <label
                    htmlFor="session-name"
                    className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3"
                  >
                    Counter / Session Name
                  </label>
                  <input
                    id="session-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Counter A, Window 3, Dr. Sharma"
                    className="w-full px-4 py-3 bg-secondary/10 border border-border/40 font-mono text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors duration-200"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                    Department / Category
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`bg-background p-4 font-mono text-xs uppercase tracking-widest transition-all duration-150 text-left ${
                          category === cat.id
                            ? "text-accent border border-accent"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Config preview */}
                {(name || category) && (
                  <div className="bg-secondary/10 border border-border/40 p-5">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                      Configuration
                    </p>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Counter:</span>
                        <span>{name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="text-accent">{category || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest">{error}</p>
                )}

                {/* Submit */}
                <button
                  onClick={handleStart}
                  disabled={loading || !name.trim() || !category || !hardwareOnline}
                  className={`w-full py-4 px-4 font-mono text-xs uppercase tracking-widest transition-all duration-200 ${
                    !name.trim() || !category || !hardwareOnline
                      ? "border border-border/20 text-muted-foreground/30 cursor-not-allowed"
                      : "border border-foreground/20 text-foreground hover:border-accent hover:text-accent cursor-pointer active:scale-95"
                  }`}
                >
                  {loading ? "Starting..." : !hardwareOnline ? "Waiting for Hardware..." : "Start Session →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
