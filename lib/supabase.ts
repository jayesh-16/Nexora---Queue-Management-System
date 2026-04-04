/**
 * Nexora — Supabase Client (Browser + Server)
 *
 * Uses the new spec schema:
 *   sessions: id, name, category, operator_id, started_at, ended_at, is_active, token_counter
 *   queue_tokens: id, session_id, token_number, status, push_subscription, issued_at, called_at, served_at
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (used in client components and API routes with anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client with service role (used in API routes that need elevated privileges)
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn("[Supabase] No service role key — falling back to anon client");
    return supabase;
  }
  return createClient(supabaseUrl, serviceKey);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type Session = {
  id: string;
  name: string;
  category: string;
  operator_id: string | null;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  token_counter: number;
};

export type QueueToken = {
  id: string;
  session_id: string;
  token_number: number;
  status: "waiting" | "called" | "served" | "dropped";
  push_subscription: object | null;
  issued_at: string;
  called_at: string | null;
  served_at: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get a session by ID */
export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) return null;
  return data;
}

/** Get the current active session */
export async function getActiveSession(): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("is_active", true)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** Get the current "now serving" number for a session */
export async function getNowServing(sessionId: string): Promise<number> {
  const { data } = await supabase
    .from("queue_tokens")
    .select("token_number")
    .eq("session_id", sessionId)
    .eq("status", "called")
    .order("token_number", { ascending: false })
    .limit(1)
    .single();

  return data?.token_number ?? 0;
}

/** Get queue stats for a session */
export async function getQueueStats(sessionId: string) {
  // Total issued
  const { count: totalIssued } = await supabase
    .from("queue_tokens")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  // Waiting count
  const { count: waitingCount } = await supabase
    .from("queue_tokens")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "waiting");

  // Now serving
  const nowServing = await getNowServing(sessionId);

  // Served count
  const { count: servedCount } = await supabase
    .from("queue_tokens")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "served");

  // Average wait time
  const { data: servedTokens } = await supabase
    .from("queue_tokens")
    .select("issued_at, called_at")
    .eq("session_id", sessionId)
    .eq("status", "served")
    .not("called_at", "is", null);

  let avgWaitMins = 0;
  if (servedTokens && servedTokens.length > 0) {
    const totalMs = servedTokens.reduce((acc, t) => {
      return acc + (new Date(t.called_at!).getTime() - new Date(t.issued_at).getTime());
    }, 0);
    avgWaitMins = Math.round(totalMs / servedTokens.length / 60000);
  }

  return {
    totalIssued: totalIssued ?? 0,
    waitingCount: waitingCount ?? 0,
    servedCount: servedCount ?? 0,
    nowServing,
    avgWaitMins,
  };
}

/** Subscribe to real-time token changes */
export function subscribeToTokenChanges(
  sessionId: string,
  onUpdate: () => void
) {
  const channel = supabase
    .channel(`queue-tokens-${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "queue_tokens",
        filter: `session_id=eq.${sessionId}`,
      },
      onUpdate
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
