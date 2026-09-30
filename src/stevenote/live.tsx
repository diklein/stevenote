"use client";

import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
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
}: {
  backup?: { src: string; poster?: string };
  /** Runs when the slide becomes active. Reject to fall back. */
  check?: () => Promise<unknown>;
  children: ReactNode;
  label?: string;
}) {
  const { active, preview, index } = useSlide();
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
    if (!active || preview || !check || mode === "backup") return;
    let cancelled = false;
    check().catch((e: unknown) => {
      if (!cancelled) fallBack(e instanceof Error ? e.message : "health check failed");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, preview]);

  useEffect(() => {
    if (!active || preview || !backup) return;
    const onToggle = () => {
      setMode((m) => (m === "live" ? "backup" : "live"));
      setReason((r) => (mode === "live" ? "switched by hand" : r));
      window.dispatchEvent(new CustomEvent("stevenote:alert", { detail: { slide: index, message: mode === "live" ? `${label}: backup video on.` : null } }));
    };
    window.addEventListener("stevenote:toggle-backup", onToggle);
    return () => window.removeEventListener("stevenote:toggle-backup", onToggle);
  }, [active, preview, backup, mode, index, label]);

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
