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

/* ---------- the grid ---------- */

/** The slide's 12-column grid. Children are Cols. `fill` stretches rows to the slide height. */
export function Grid({ children, fill = false, style, className }: { children: ReactNode; fill?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <div className={["sn-grid", className].filter(Boolean).join(" ")} data-fill={fill || undefined} style={style}>
      {children}
    </div>
  );
}

/** A span of columns. `start` is 1-based. `align` is the vertical alignment within the row. */
export function Col({ span = 12, start, align, children, style, className }: { span?: number; start?: number; align?: "start" | "center" | "end" | "stretch"; children?: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ gridColumn: start ? `${start} / span ${span}` : `span ${span}`, alignSelf: align, minWidth: 0, minHeight: 0, ...style }}>
      {children}
    </div>
  );
}

/* ---------- layouts, on the grid ---------- */

export function Statement({ kicker, children, sub, align = "left" }: { kicker?: ReactNode; children: ReactNode; sub?: ReactNode; align?: "left" | "center" }) {
  return (
    <Grid>
      <Col span={10} start={align === "center" ? 2 : 1} style={{ textAlign: align }}>
        {kicker && <p className="muted" style={{ fontSize: "var(--sn-step-1)", lineHeight: "var(--sn-lh-1)", marginBottom: "var(--sn-base)" }}>{kicker}</p>}
        <h2 style={{ fontSize: "var(--sn-step-5)", lineHeight: "var(--sn-lh-5)" }}>{children}</h2>
        {sub && <div className="muted" style={{ fontSize: "var(--sn-step-2)", lineHeight: "var(--sn-lh-2)", marginTop: "calc(var(--sn-base) * 2)", maxWidth: align === "center" ? undefined : "calc(var(--sn-col) * 8 + var(--sn-gutter) * 7)" }}>{sub}</div>}
      </Col>
    </Grid>
  );
}

/** A huge number with one claim and a bare source. Counts up when the slide becomes active. */
export function Stat({ value, format, claim, source, duration = 1100 }: { value: number; format?: (n: number) => string; claim: ReactNode; source?: ReactNode; duration?: number }) {
  const shown = useCountUp(value, duration);
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString());
  return (
    <Grid>
      <Col span={10}>
        <div className="tabular" style={{ fontSize: "var(--sn-step-6)", lineHeight: "var(--sn-lh-6)", fontWeight: 600, letterSpacing: "-0.04em", fontFamily: "var(--sn-font-display)" }}>{fmt(shown)}</div>
        <p style={{ fontSize: "var(--sn-step-3)", lineHeight: "var(--sn-lh-3)", marginTop: "var(--sn-base)", fontWeight: 500, letterSpacing: "-0.01em", maxWidth: "calc(var(--sn-col) * 9 + var(--sn-gutter) * 8)" }}>{claim}</p>
        {source && <p className="muted" style={{ fontSize: "var(--sn-step-0)", lineHeight: "var(--sn-lh-0)", marginTop: "var(--sn-base)" }}>{source}</p>}
      </Col>
    </Grid>
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

/** A headline in the left seven columns and one piece of proof in the right five. */
export function Evidence({ headline, children, aside }: { headline: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <Grid fill>
      <Col span={7} align="center">
        <h2 style={{ fontSize: "var(--sn-step-4)", lineHeight: "var(--sn-lh-4)" }}>{headline}</h2>
        {aside && <p className="muted" style={{ fontSize: "var(--sn-step-1)", lineHeight: "var(--sn-lh-1)", marginTop: "calc(var(--sn-base) * 2)", maxWidth: "calc(var(--sn-col) * 6 + var(--sn-gutter) * 5)" }}>{aside}</p>}
      </Col>
      <Col span={5} align="center">{children}</Col>
    </Grid>
  );
}

/** Frames a live component with a sentence that says what the audience is about to watch. */
export function LiveFrame({ title, subtitle, compact = false, children }: { title: ReactNode; subtitle?: ReactNode; compact?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? "var(--sn-base)" : "calc(var(--sn-base) * 2)", height: "100%" }}>
      <div>
        <h2 style={{ fontSize: compact ? "var(--sn-step-2)" : "var(--sn-step-3)", lineHeight: compact ? "var(--sn-lh-2)" : "var(--sn-lh-3)" }}>{title}</h2>
        {subtitle && <p className="muted" style={{ fontSize: "var(--sn-step-1)", lineHeight: "var(--sn-lh-1)", maxWidth: "calc(var(--sn-col) * 9 + var(--sn-gutter) * 8)" }}>{subtitle}</p>}
      </div>
      <div data-live style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

/** Even columns on the grid: n columns of 12/n. */
export function Columns({ n = 2, children, style, fill = false }: { n?: number; gap?: string; children: ReactNode; style?: CSSProperties; fill?: boolean }) {
  const span = Math.max(1, Math.floor(12 / n));
  return (
    <Grid fill={fill} style={style}>
      {Children.map(children, (child, i) => (
        <Col key={i} span={span}>{child}</Col>
      ))}
    </Grid>
  );
}

/** A card with a rule. Padding in baseline units. */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ border: "1px solid var(--sn-rule)", borderRadius: "var(--sn-radius)", padding: "calc(var(--sn-base) * 2)", fontSize: "var(--sn-step-0)", lineHeight: "var(--sn-lh-0)", ...style }}>{children}</div>;
}

/** Full-width image or figure. */
export function Media({ src, alt, fit = "contain", caption }: { src: string; alt: string; fit?: "contain" | "cover"; caption?: ReactNode }) {
  return (
    <figure style={{ margin: 0, height: "100%", display: "flex", flexDirection: "column", gap: "var(--sn-base)", alignItems: "center", minHeight: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ maxWidth: "100%", maxHeight: caption ? "calc(100% - var(--sn-lh-0) - var(--sn-base))" : "100%", minHeight: 0, objectFit: fit, borderRadius: "var(--sn-radius)" }} />
      {caption && <figcaption className="muted" style={{ fontSize: "var(--sn-step-0)", lineHeight: "var(--sn-lh-0)" }}>{caption}</figcaption>}
    </figure>
  );
}
