"use client";

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useSlide } from "./context";
import { Video } from "./video";

/**
 * A live component with a recorded backup, after Marcin Wichary's rule: anything that talks to a
 * server gets a screencast standing behind it. The backup takes over when the component throws,
 * when the optional health check fails on slide entry, or when the presenter presses X.
 * Every switch raises an alert that the notes window shows.
 */
export function Live({
  backup,
  check,
  children,
  label = "live",
  triggers = [],
  still,
}: {
  backup?: { src: string; poster?: string };
  /** Runs when the slide becomes active. Reject to fall back. */
  check?: () => Promise<unknown>;
  children: ReactNode;
  label?: string;
  /** Controls the notes window can press for the presenter; the component answers them with useTriggers. */
  triggers?: string[];
  /** A picture of the component for the notes window, where it is not run. */
  still?: string;
}) {
  const { active, preview, mirror, index } = useSlide();
  const [mode, setMode] = useState<"live" | "backup">("live");
  const [reason, setReason] = useState<string | null>(null);

  const fallBack = useCallback(
    (why: string) => {
      if (!backup) return;
      setMode("backup");
      setReason(why);
      window.dispatchEvent(new CustomEvent("stevenote:alert", { detail: { slide: index, message: `${label}: ${why}. Showing the backup video.` } }));
    },
    [backup, index, label],
  );

  useEffect(() => {
    if (preview || mirror || !backup) return;
    window.dispatchEvent(new CustomEvent("stevenote:backup-available", { detail: { slide: index, available: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent("stevenote:backup-available", { detail: { slide: index, available: false } }));
    };
  }, [preview, mirror, backup, index]);

  useEffect(() => {
    if (!active || preview || mirror || !check || mode === "backup") return;
    let cancelled = false;
    check().catch((e: unknown) => {
      if (!cancelled) fallBack(e instanceof Error ? e.message : "health check failed");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, preview, mirror]);

  useEffect(() => {
    if (!active || preview || mirror || !backup) return;
    const onToggle = () => {
      setMode((m) => (m === "live" ? "backup" : "live"));
      setReason((r) => (mode === "live" ? "switched by hand" : r));
      window.dispatchEvent(new CustomEvent("stevenote:alert", { detail: { slide: index, message: mode === "live" ? `${label}: backup video on.` : null } }));
    };
    window.addEventListener("stevenote:toggle-backup", onToggle);
    return () => window.removeEventListener("stevenote:toggle-backup", onToggle);
  }, [active, preview, mirror, backup, mode, index, label]);

  // A component with a health check talks to a server: the notes window shows its name instead of a second copy,
  // with a button for each control the component offers, pressed on the stage through the deck.
  if (mirror && check) {
    return (
      <div className="muted" style={{ position: "relative", height: "100%", border: still ? undefined : "1px dashed var(--sn-rule)", borderRadius: "var(--sn-radius)", overflow: "hidden", display: "grid", placeItems: "center", alignContent: "center", gap: "2cqi", fontSize: "var(--sn-step-0)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {still && <img src={still} alt={`${label}, as it looks when it has run`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.9 }} />}
        {!still && <span>live: {label}</span>}
        {triggers.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("stevenote:nav", { detail: { action: "trigger", label: t } }))}
            style={{ position: "relative", font: "inherit", fontSize: "var(--sn-step-1)", fontWeight: 500, color: "var(--sn-bg)", background: "var(--sn-fg)", border: 0, borderRadius: "999px", padding: "1cqi 3cqi", cursor: "pointer", boxShadow: "0 1cqi 3cqi oklch(0% 0 0 / 0.4)" }}
          >
            {t}
          </button>
        ))}
      </div>
    );
  }

  if (mode === "backup" && backup) {
    return (
      <div data-live-backup title={reason ?? undefined} style={{ height: "100%" }}>
        <Video src={backup.src} poster={backup.poster} dimWhilePlaying={false} />
      </div>
    );
  }

  return (
    <LiveBoundary onError={(e) => fallBack(e.message)} hasBackup={!!backup}>
      {children}
    </LiveBoundary>
  );
}

/**
 * Answer the notes window's trigger buttons: `handlers` maps each label a Live lists in `triggers` to what pressing
 * it does on the stage. Only the slide on screen answers, so a trigger never fires twice.
 */
export function useTriggers(handlers: Record<string, () => void>) {
  const { active, preview, mirror } = useSlide();
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });
  useEffect(() => {
    if (!active || preview || mirror) return;
    const on = (e: Event) => ref.current[(e as CustomEvent<string>).detail]?.();
    window.addEventListener("stevenote:trigger", on);
    return () => window.removeEventListener("stevenote:trigger", on);
  }, [active, preview, mirror]);
}

class LiveBoundary extends Component<{ children: ReactNode; onError: (e: Error) => void; hasBackup: boolean }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    if (this.state.error && !this.props.hasBackup) {
      return (
        <div className="muted" style={{ fontSize: "var(--sn-step-0)", padding: "2cqi", border: "1px solid var(--sn-rule)", borderRadius: "var(--sn-radius)" }}>
          This component failed: {this.state.error.message}
        </div>
      );
    }
    if (this.state.error) return null;
    return this.props.children;
  }
}
