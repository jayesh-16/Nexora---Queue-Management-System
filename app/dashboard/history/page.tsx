/**
 * Session History — Past queue sessions
 *
 * Lists all sessions with token stats and timestamps.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface SessionRecord {
  id: string;
  name: string;
  category: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  totalIssued: number;
  totalServed: number;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    const { data: rawSessions } = await supabase
      .from("sessions")
      .select("id, name, category, started_at, ended_at, is_active")
      .order("started_at", { ascending: false })
      .limit(50);

    if (!rawSessions || rawSessions.length === 0) {
      setSessions([]);
      setLoading(false);
      return;
    }

    // Get token counts per session
    const ids = rawSessions.map((s) => s.id);
    const { data: tokens } = await supabase
      .from("queue_tokens")
      .select("session_id, status")
      .in("session_id", ids);

    const countMap: Record<string, { issued: number; served: number }> = {};
    (tokens ?? []).forEach((t) => {
      if (!countMap[t.session_id]) countMap[t.session_id] = { issued: 0, served: 0 };
      countMap[t.session_id].issued++;
      if (t.status === "served") countMap[t.session_id].served++;
    });

    setSessions(
      rawSessions.map((s) => ({
        ...s,
        totalIssued: countMap[s.id]?.issued ?? 0,
        totalServed: countMap[s.id]?.served ?? 0,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDuration = (start: string, end: string | null) => {
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - new Date(start).getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="p-5 md:p-8 max-w-5xl mx-auto">
        <div className="h-8 w-36 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Past queue sessions and their performance
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="card-lg p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No sessions yet</p>
          <a href="/dashboard/new" className="btn-primary inline-block mt-4">
            Start your first session
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const completion = s.totalIssued > 0 ? Math.round((s.totalServed / s.totalIssued) * 100) : 0;
            return (
              <div
                key={s.id}
                className={`card p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  s.is_active ? "border-l-4 border-l-nexora-500" : ""
                }`}
              >
                {/* Date & Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {s.name || "Unnamed Session"}
                    </p>
                    {s.is_active && (
                      <span className="text-[10px] font-bold text-nexora-700 bg-nexora-50 px-2 py-0.5 rounded-full border border-nexora-100">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(s.started_at)} · {formatTime(s.started_at)}
                    {s.ended_at && ` → ${formatTime(s.ended_at)}`}
                    {" · "}
                    {getDuration(s.started_at, s.ended_at)}
                    {" · "}
                    {s.category}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm flex-shrink-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{s.totalIssued}</p>
                    <p className="text-xs text-gray-400">issued</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-nexora-700">{s.totalServed}</p>
                    <p className="text-xs text-gray-400">served</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${completion >= 80 ? "text-nexora-700" : completion >= 50 ? "text-amber-600" : "text-red-500"}`}>
                      {completion}%
                    </p>
                    <p className="text-xs text-gray-400">rate</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
