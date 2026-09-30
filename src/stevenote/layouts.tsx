"use client";

import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSlide } from "./context";
import { useStep, type StepState } from "./steps";

/* ---------- builds ---------- */

export type StepEffect = "up" | "fade" | "scale" | "blur" | "highlight" | "none";

/**
 * One build step. Wrap anything. Omit `at` for document order; pass a number for an absolute click.
 * `dim` fades the item once a later step is active, for "current" emphasis.
 */
export function Step({
  at,
  effect = "up",
  dim = false,
  as: Tag = "div",
  className,
  style,
  children,
}: {
  at?: number;
  effect?: StepEffect;
  dim?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { state } = useStep(at, ref);
  const Comp = Tag as unknown as React.ComponentType<Record<string, unknown>>;
  return (
    <Comp ref={ref} className={className} style={style} data-step={state} data-step-effect={effect} data-step-dim={dim || undefined}>
      {children}
    </Comp>
  );
}

/** Wrap each child in a Step, in order. */
export function Steps({ effect, dim, gap = "1.2cqi", className, children }: { effect?: StepEffect; dim?: boolean; gap?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className} style={{ display: "grid", gap }}>
      {Children.map(children, (child, i) => (
        <Step key={i} effect={effect} dim={dim}>
          {child}
        </Step>
      ))}
    </div>
  );
}

/** Read a step's state without rendering a wrapper, for components that render their own markup. */
export function useStepState(at?: number): StepState {
  return useStep(at).state;
}

/* ---------- morph ---------- */

/**
 * An element that carries across slides. Give the same name to an element on the next slide and the
 * "morph" transition moves and scales it between the two. Names are only applied to the active slide,
 * because the View Transitions API refuses duplicate names.
 */
export function Morph({ name, as: Tag = "div", className, style, children }: { name: string; as?: keyof React.JSX.IntrinsicElements; className?: string; style?: CSSProperties; children: ReactNode }) {
  const { active, preview } = useSlide();
  const Comp = Tag as unknown as React.ComponentType<Record<string, unknown>>;
  const vt = active && !preview ? ({ viewTransitionName: `morph-${name}` } as CSSProperties) : undefined;
  return (
    <Comp className={className} style={{ ...style, ...vt }}>
      {children}
    </Comp>
  );
}

/* ---------- layouts ---------- */

export function Statement({ kicker, children, sub, align = "left" }: { kicker?: ReactNode; children: ReactNode; sub?: ReactNode; align?: "left" | "center" }) {
  return (
    <div style={{ maxWidth: "80cqi", margin: align === "center" ? "0 auto" : undefined, textAlign: align }}>
      {kicker && <p className="muted" style={{ fontSize: "var(--sn-step-1)", marginBottom: "1.2cqi" }}>{kicker}</p>}
      <h2 style={{ fontSize: "var(--sn-step-5)" }}>{children}</h2>
      {sub && <div className="muted" style={{ fontSize: "var(--sn-step-2)", marginTop: "2cqi", maxWidth: "64cqi", marginInline: align === "center" ? "auto" : undefined, lineHeight: 1.35 }}>{sub}</div>}
    </div>
  );
}

/** A huge number with one claim and a bare source. Counts up when the slide becomes active. */
export function Stat({ value, format, claim, source, duration = 1100 }: { value: number; format?: (n: number) => string; claim: ReactNode; source?: ReactNode; duration?: number }) {
  const shown = useCountUp(value, duration);
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString());
  return (
    <div style={{ maxWidth: "84cqi" }}>
      <div className="tabular" style={{ fontSize: "var(--sn-step-6)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 0.95, fontFamily: "var(--sn-font-display)" }}>{fmt(shown)}</div>
      <p style={{ fontSize: "var(--sn-step-3)", marginTop: "2cqi", maxWidth: "70cqi", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.01em" }}>{claim}</p>
      {source && <p className="muted" style={{ fontSize: "var(--sn-step-0)", marginTop: "1.6cqi" }}>{source}</p>}
    </div>
  );
}

export function useCountUp(target: number, duration = 1100) {
  const { active, preview } = useSlide();
  const animate = active && !preview && !reducedMotion();
  const [n, setN] = useState(() => (animate ? 0 : target));
  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, target, duration]);
  return animate ? n : target;
}

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A headline and one piece of proof. Nothing to read while speaking. */
export function Evidence({ headline, children, aside }: { headline: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--sn-gap)", alignItems: "center" }}>
      <div>
        <h2 style={{ fontSize: "var(--sn-step-4)" }}>{headline}</h2>
        {aside && <p className="muted" style={{ fontSize: "var(--sn-step-1)", marginTop: "2cqi", maxWidth: "36cqi" }}>{aside}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/** Frames a live component with a sentence that says what the audience is about to watch. */
export function LiveFrame({ title, subtitle, compact = false, children }: { title: ReactNode; subtitle?: ReactNode; compact?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? "1.2cqi" : "2.4cqi", height: "100%" }}>
      <div>
        <h2 style={{ fontSize: compact ? "var(--sn-step-2)" : "var(--sn-step-3)" }}>{title}</h2>
        {subtitle && <p className="muted" style={{ fontSize: "var(--sn-step-1)", marginTop: "1cqi", maxWidth: "70cqi" }}>{subtitle}</p>}
      </div>
      <div data-live style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

/** Even columns. */
export function Columns({ n = 2, gap = "var(--sn-gap)", children, style }: { n?: number; gap?: string; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap, ...style }}>{children}</div>;
}

/** A card with a rule. */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ border: "1px solid var(--sn-rule)", borderRadius: "var(--sn-radius)", padding: "2.2cqi", fontSize: "var(--sn-step-0)", ...style }}>{children}</div>;
}

/** Full-bleed image or figure. */
export function Media({ src, alt, fit = "contain", caption }: { src: string; alt: string; fit?: "contain" | "cover"; caption?: ReactNode }) {
  return (
    <figure style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column", gap: "1.2cqi", alignItems: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ maxWidth: "100%", maxHeight: caption ? "74cqh" : "84cqh", objectFit: fit, borderRadius: "var(--sn-radius)" }} />
      {caption && <figcaption className="muted" style={{ fontSize: "var(--sn-step-0)" }}>{caption}</figcaption>}
    </figure>
  );
}
