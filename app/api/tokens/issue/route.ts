/**
 * API: Issue Token
 *
 * POST /api/tokens/issue
 * Body: { sessionId: string }
 * Returns: { tokenNumber: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get current session
    const { data: session, error: sessError } = await supabase
      .from("sessions")
      .select("id, token_counter, is_active")
      .eq("id", sessionId)
      .single();

    if (sessError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.is_active) {
      return NextResponse.json({ error: "Session has ended" }, { status: 400 });
    }

    // Increment token counter
    const nextNumber = session.token_counter + 1;

    const { error: updateError } = await supabase
      .from("sessions")
      .update({ token_counter: nextNumber })
      .eq("id", sessionId);

    if (updateError) throw updateError;

    // Insert token
    const { error: insertError } = await supabase
      .from("queue_tokens")
      .insert({
        session_id: sessionId,
        token_number: nextNumber,
        status: "waiting",
      });

    if (insertError) throw insertError;

    return NextResponse.json({ tokenNumber: nextNumber });
  } catch (err) {
    console.error("[API] Issue token error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
