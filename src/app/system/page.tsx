"use client";

import { useState, type CSSProperties } from "react";
import { Col, Grid, Stage, Step, Statement, runTransition, TRANSITIONS, type DeckDef, type TransitionName } from "@/stevenote";

/**
 * The design system page: the tokens, the type scale, the transitions and the step effects, each
 * rendered by the same engine that renders a deck, so what you see here is what a slide gets.
 */

const STEPS = ["--sn-step--1", "--sn-step-0", "--sn-step-1", "--sn-step-2", "--sn-step-3", "--sn-step-4", "--sn-step-5", "--sn-step-6"];
const STEP_VALUES = ["1 base", "1.5", "2", "2.5", "3", "4", "6", "10 base"];
const COLORS: [string, string][] = [
  ["--sn-bg", "background"],
  ["--sn-fg", "foreground"],
  ["--sn-muted", "muted"],
  ["--sn-accent", "accent"],
  ["--sn-rule", "rule"],
];

const typeDeck: DeckDef = {
  id: "system-type",
  title: "Type",
  slides: [
    {
      id: "scale",
      style: { "--sn-pad": "3cqi" } as CSSProperties,
      content: (
        <div style={{ display: "grid", gap: "0.8cqi" }}>
          {STEPS.map((v, i) => (
            <div key={v} style={{ display: "grid", gridTemplateColumns: "14cqi 1fr", alignItems: "baseline", gap: "2cqi" }}>
              <code className="muted" style={{ fontSize: "var(--sn-step--1)" }}>{v.replace("--sn-", "")} {STEP_VALUES[i]}</code>
              <div style={{ fontSize: `var(${v})`, lineHeight: 1.05, fontWeight: i >= 4 ? 600 : 400, letterSpacing: i >= 4 ? "-0.02em" : 0, fontFamily: i >= 4 ? "var(--sn-font-display)" : undefined }}>
                {i === 7 ? "12,000" : i >= 4 ? "The numbers roll up." : "Every month the numbers roll up three levels."}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ],
};

function transitionDeck(theme: "light" | "dark"): DeckDef {
  return {
    id: `system-transition-${theme}`,
    title: "Transitions",
    theme,
    slides: [
      { id: "a", content: <Statement kicker="Slide A">The same agent, the same model, the same question.</Statement> },
      { id: "b", theme: theme === "light" ? "dark" : "light", content: <Statement kicker="Slide B" align="center">A different table.</Statement> },
    ],
  };
}

const gridDeck: DeckDef = {
  id: "system-grid",
  title: "Grid",
  slides: [
    {
      id: "grid",
      content: (
        <Grid fill>
          <Col span={7} align="center">
            <h2 style={{ fontSize: "var(--sn-step-4)", lineHeight: "var(--sn-lh-4)" }}>Twelve columns, one baseline.</h2>
            <p className="muted" style={{ fontSize: "var(--sn-step-1)", lineHeight: "var(--sn-lh-1)", marginTop: "calc(var(--sn-base) * 2)" }}>Margin four baselines, gutter one, baseline 1.25cqi. Every size and line height is a number of baselines.</p>
          </Col>
          <Col span={5} align="center">
            <div style={{ border: "1px solid var(--sn-rule)", borderRadius: "var(--sn-radius)", padding: "calc(var(--sn-base) * 2)", fontSize: "var(--sn-step-0)", lineHeight: "var(--sn-lh-0)" }}>A card in the right five columns, padded in baselines.</div>
          </Col>
          {[6, 4, 2].map((n) => (
            <Col key={n} span={n}>
              <div className="muted" style={{ borderTop: "1px solid var(--sn-rule)", paddingTop: "var(--sn-base)", fontSize: "var(--sn-step--1)", lineHeight: "var(--sn-lh--1)" }}>span {n}</div>
            </Col>
          ))}
        </Grid>
      ),
    },
  ],
};

const stepDeck: DeckDef = {
  id: "system-steps",
  title: "Steps",
  slides: [
    {
      id: "effects",
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2cqi" }}>
          {(["up", "fade", "scale", "blur", "highlight", "none"] as const).map((effect) => (
            <Step key={effect} effect={effect}>
              <div style={{ border: "1px solid var(--sn-rule)", borderRadius: "var(--sn-radius)", padding: "2cqi" }}>
                <p style={{ fontSize: "var(--sn-step-2)", fontWeight: 500 }}>{effect}</p>
                <p className="muted" style={{ fontSize: "var(--sn-step--1)" }}>effect=&quot;{effect}&quot;</p>
              </div>
            </Step>
          ))}
        </div>
      ),
    },
  ],
};

const wrap: CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 6rem", fontFamily: "var(--font-geist-sans)" };
const h2: CSSProperties = { fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em", margin: "3rem 0 0.5rem" };
const p: CSSProperties = { color: "oklch(70% 0 0)", margin: "0 0 1.25rem", maxWidth: 720, lineHeight: 1.5 };
const btn: CSSProperties = { border: "1px solid oklch(35% 0 0)", borderRadius: "0.5rem", padding: "0.4rem 0.9rem", background: "transparent", color: "inherit", cursor: "pointer", fontFamily: "var(--font-geist-mono)", fontSize: "0.85rem" };

export default function SystemPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [slide, setSlide] = useState(0);
  const [last, setLast] = useState<TransitionName>("fade");
  const [step, setStep] = useState(0);
  const tDeck = transitionDeck(theme);

  const play = (name: TransitionName) => {
    setLast(name);
    runTransition(name, slide === 0 ? "forward" : "back", () => setSlide((s) => (s === 0 ? 1 : 0)));
  };

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Stevenote system</h1>
      <p style={p}>Tokens, type, motion and builds, rendered by the deck engine itself. Everything is sized in container units, so it holds at any window size.</p>

      <h2 style={h2}>Type scale</h2>
      <p style={p}>Eight steps, each a whole or half number of baselines (the baseline is 1.25 percent of the stage width), with line heights that are whole baselines. Headlines use steps 4 and up, semibold, tight tracking, balanced wrapping. Body text is step 0 with pretty wrapping. Geist Sans and Geist Mono.</p>
      <Stage deck={typeDeck} state={{ slide: 0, step: 0, blank: null }} stepCounts={{}} embedded />

      <h2 style={h2}>Grid</h2>
      <p style={p}>A strict grid: twelve columns between margins of four baselines with one-baseline gutters, on a 1.25cqi baseline. Layouts place content with Grid and Col; type sizes carry line heights that are whole baselines, so text on adjacent columns sits on the same lines. G in a deck shows the overlay.</p>
      <Stage deck={gridDeck} state={{ slide: 0, step: 0, blank: null }} stepCounts={{}} embedded prefs={{ transition: "deck", theme: "deck", motion: "auto", dimVideo: true, counter: "hover", hideCursor: true, letterbox: "black", typeScale: 1, hurry: false, reviewFlags: false, gridOverlay: true }} />

      <h2 style={h2}>Colour</h2>
      <p style={p}>Five tokens in OKLCH per theme. A slide can override any of them inline, and every component reads tokens rather than literal colours, so a background swap reskins builds, cards and code.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {(["light", "dark"] as const).map((t) => (
          <div key={t} className="sn-stage" data-theme={t} style={{ width: "100%", aspectRatio: "auto", padding: "1.25rem", borderRadius: "0.75rem", fontSize: "0.9rem", containerType: "normal" }}>
            <p style={{ fontWeight: 500, marginBottom: "0.75rem" }}>{t}</p>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {COLORS.map(([v, name]) => (
                <div key={v} style={{ display: "grid", gridTemplateColumns: "2.5rem 1fr", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ display: "block", height: "2rem", borderRadius: "0.4rem", background: `var(${v})`, border: "1px solid var(--sn-rule)" }} />
                  <code style={{ fontSize: "0.8rem" }}>{v} <span className="muted">{name}</span></code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 style={h2}>Transitions</h2>
      <p style={p}>Nine styles on the View Transitions API. Cube runs at 700ms with an ease-in-out, since both faces are on screen the whole time. Slide changes take 350ms on cubic-bezier(0.32, 0.72, 0, 1); exits run faster than enters; reduced motion collapses everything to a 120ms crossfade. Direction follows forward and back.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        {TRANSITIONS.map((t) => (
          <button key={t} type="button" style={{ ...btn, borderColor: t === last ? "white" : undefined }} onClick={() => play(t)}>
            {t}
          </button>
        ))}
        <button type="button" style={{ ...btn, marginLeft: "auto" }} onClick={() => setTheme((v) => (v === "light" ? "dark" : "light"))}>
          theme: {theme}
        </button>
      </div>
      <Stage deck={tDeck} state={{ slide, step: 0, blank: null }} stepCounts={{}} embedded animate />

      <h2 style={h2}>Builds</h2>
      <p style={p}>A step is a click. Six enter effects, 240ms each. Past steps can dim to 35 percent so the current one reads. Registration happens before first paint, so revisiting a slide never replays its builds.</p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button type="button" style={btn} onClick={() => setStep((s) => Math.max(0, s - 1))}>back</button>
        <button type="button" style={btn} onClick={() => setStep((s) => Math.min(6, s + 1))}>next step ({step} of 6)</button>
        <button type="button" style={btn} onClick={() => setStep(0)}>reset</button>
      </div>
      <Stage deck={stepDeck} state={{ slide: 0, step, blank: null }} stepCounts={{ 0: 6 }} embedded />

      <h2 style={h2}>Motion tokens</h2>
      <table style={{ borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <tbody>
          {[
            ["--sn-duration", "350ms", "slide change"],
            ["--sn-step-duration", "240ms", "build step"],
            ["--sn-ease-out", "cubic-bezier(0.32, 0.72, 0, 1)", "every enter"],
            ["exit", "70% of the enter", "fade and zoom exits"],
            ["reduced motion", "120ms linear crossfade", "all of the above"],
            ["focus dim", "500ms, to 28%", "text outside a playing video"],
          ].map(([k, v, d]) => (
            <tr key={k} style={{ borderTop: "1px solid oklch(25% 0 0)" }}>
              <td style={{ padding: "0.5rem 1.5rem 0.5rem 0", fontFamily: "var(--font-geist-mono)" }}>{k}</td>
              <td style={{ padding: "0.5rem 1.5rem 0.5rem 0", fontFamily: "var(--font-geist-mono)" }}>{v}</td>
              <td style={{ padding: "0.5rem 0", color: "oklch(70% 0 0)" }}>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
