/**
 * Notification Prompt — asks customer for push notification permission
 *
 * Only shown if permission hasn't been granted yet.
 * Appears on the /scan page after token is issued.
 */

"use client";

import { useState, useEffect } from "react";
import { subscribeToPush } from "@/lib/push";

interface NotificationPromptProps {
  tokenNumber: number;
}

export default function NotificationPrompt({ tokenNumber }: NotificationPromptProps) {
  const [status, setStatus] = useState<"idle" | "granted" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission === "granted") {
      setStatus("granted");
    } else if (Notification.permission === "denied") {
      setStatus("denied");
    }
  }, []);

  const handleAllow = async () => {
    const sub = await subscribeToPush(tokenNumber);
    setStatus(sub ? "granted" : "denied");
  };

  if (status === "granted" || status === "unsupported") return null;

  if (status === "denied") {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
        <p className="text-sm text-amber-700">
          Notifications blocked — you can enable them in browser settings
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-nexora-50 border border-nexora-100 p-5 text-center space-y-3">
      <div className="flex items-center justify-center gap-2 text-nexora-700">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="text-sm font-semibold">Get notified</span>
      </div>

      <p className="text-sm text-gray-500">
        Allow notifications so we can alert you when your turn arrives — 
        even if your phone is locked
      </p>

      <button
        onClick={handleAllow}
        className="btn-secondary w-full text-sm py-2.5"
      >
        Allow notifications
      </button>
    </div>
  );
}
