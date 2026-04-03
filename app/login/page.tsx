/**
 * Operator Login — PIN-based authentication
 * New dark editorial design. All PIN logic, keyboard support,
 * shake animation, and routing preserved.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const PIN_LENGTH = 6;
const CORRECT_PIN = process.env.NEXT_PUBLIC_OPERATOR_PIN || "123456";

const KEYS = [
  { num: "1", sub: "" },  { num: "2", sub: "ABC" }, { num: "3", sub: "DEF" },
  { num: "4", sub: "GHI" }, { num: "5", sub: "JKL" }, { num: "6", sub: "MNO" },
  { num: "7", sub: "PQRS" }, { num: "8", sub: "TUV" }, { num: "9", sub: "WXYZ" },
  { num: "", sub: "" }, { num: "0", sub: "+" }, { num: "del", sub: "" },
];

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleKey = (key: string) => {
    setError(false);
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => {
          if (newPin === CORRECT_PIN) {
            setSuccess(true);
            setTimeout(() => router.push("/dashboard"), 400);
          } else {
            setError(true);
            setShake(true);
            if ("vibrate" in navigator) navigator.vibrate([60, 40, 60]);
            setTimeout(() => { setPin(""); setShake(false); setError(false); }, 650);
          }
        }, 180);
      }
    }
  };

  const handleDelete = () => { setError(false); setPin((p) => p.slice(0, -1)); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleKey(e.key);
      if (e.key === "Backspace") handleDelete();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-10px); }
          30%       { transform: translateX(10px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        .shake { animation: shake 0.55s ease-in-out; }
      `}</style>

      <main className="relative min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 sm:px-6 py-8">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-md flex-1 flex flex-col justify-center">
          {/* Header text */}
          <div className="mb-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">
              Operator
            </p>
            <h1 className="font-[var(--font-bebas)] text-5xl tracking-tight">
              NEXORA
            </h1>
          </div>

          {/* PIN Card */}
          <div className="border border-border/40 p-6 sm:p-10 bg-background/50 backdrop-blur-sm flex flex-col flex-1 justify-center min-h-[60vh]">
            <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mb-8 text-center">
              Staff Access
            </p>

            {/* PIN dots */}
            <div className="flex flex-col items-center mb-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                Enter Passcode
              </p>
              <div className={shake ? "shake flex gap-4" : "flex gap-4"}>
                {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                  const filled = i < pin.length;
                  return (
                    <div
                      key={i}
                      className={`w-3 h-3 border transition-all duration-150 ${
                        filled
                          ? error
                            ? "bg-red-500 border-red-400"
                            : success
                              ? "bg-accent border-accent"
                              : "bg-foreground border-foreground"
                          : "border-border/60 bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>
              {error && (
                <p className="font-mono text-[10px] text-red-400 mt-3 uppercase tracking-widest">
                  Incorrect passcode
                </p>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-border/40 mb-6" />

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {KEYS.map((k, i) => {
                if (k.num === "" && k.sub === "") return <div key={i} />;

                if (k.num === "del") {
                  return (
                    <button
                      key={i}
                      onClick={handleDelete}
                      aria-label="Delete"
                      className="flex items-center justify-center h-16 sm:h-20 border border-border/30 text-muted-foreground hover:border-accent hover:text-accent transition-all duration-150 bg-secondary/5"
                    >
                      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                      </svg>
                    </button>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleKey(k.num)}
                    aria-label={k.num}
                    className="flex flex-col items-center justify-center h-16 sm:h-20 border border-border/30 hover:border-accent hover:text-accent active:scale-95 transition-all duration-150 select-none bg-secondary/5"
                  >
                    <span className="font-[var(--font-bebas)] text-3xl sm:text-4xl tracking-tight leading-none">{k.num}</span>
                    {k.sub && (
                      <span className="font-mono text-[8px] sm:text-[10px] text-muted-foreground tracking-[0.2em] mt-1">{k.sub}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <div className="border-t border-border/40 mt-6 mb-5" />

            {/* Back link */}
            <a
              href="/"
              className="block text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors duration-200"
            >
              ← Back to Home
            </a>
          </div>

          <p className="font-mono text-[10px] text-muted-foreground/30 text-center mt-6">
            Nexora · Admin Portal
          </p>
        </div>
      </main>
    </>
  );
}
