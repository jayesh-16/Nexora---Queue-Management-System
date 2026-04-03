/**
 * API: Save Push Subscription
 *
 * POST /api/push/subscribe
 * Body: { subscription: PushSubscription, tokenNumber: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { subscription, tokenNumber } = await req.json();

    if (!subscription || !tokenNumber) {
      return NextResponse.json(
        { error: "subscription and tokenNumber required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("queue_tokens")
      .update({ push_subscription: subscription })
      .eq("token_number", tokenNumber)
      .eq("status", "waiting");

    if (error) {
      console.error("[API] Push subscribe error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] Push subscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
