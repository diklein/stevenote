"use client";

import { useEffect, useState } from "react";
import { useSlide } from "@/stevenote";

/**
 * A live component that talks to a server route once a second. The "Break it" button throws on
 * the next render, which is how a real component fails mid-talk: the Live wrapper catches it and
 * swaps in the backup video.
 */
export function ServerClock() {
  const { active, preview } = useSlide();
  const [now, setNow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!active || preview) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/example/time", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as { now: string };
        if (!stop) setNow(j.now);
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : String(e));
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [active, preview]);

  if (broken) throw new Error("the demo component threw");

  return (
    <div style={{ display: "grid", gap: "1.6cqi" }}>
      <p className="tabular" style={{ fontSize: "var(--sn-step-5)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {now ? new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : error ?? "…"}
      </p>
      <p className="muted" style={{ fontSize: "var(--sn-step-0)" }}>Fetched from /api/example/time once a second. {error && <span style={{ color: "var(--sn-accent)" }}>{error}</span>}</p>
      <div>
        <button
          type="button"
          onClick={() => setBroken(true)}
          style={{ fontSize: "var(--sn-step-0)", padding: "0.8cqi 1.6cqi", borderRadius: "0.6cqi", border: "1px solid var(--sn-rule)", background: "transparent", color: "inherit", cursor: "pointer" }}
        >
          Break it
        </button>
      </div>
    </div>
  );
}
