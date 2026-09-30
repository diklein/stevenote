"use client";

import { useState } from "react";
import { Card, Columns, LiveFrame, Morph, Stat, Statement, Step, Steps, Video, type DeckDef } from "@/stevenote";

function Playground() {
  const [n, setN] = useState(350);
  return (
    <Columns n={2} style={{ alignItems: "center" }}>
      <Card>
        <label style={{ display: "block", fontSize: "var(--sn-step-0)" }}>
          Transition length
          <input type="range" min={100} max={900} step={10} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ width: "100%", marginTop: "1cqi" }} />
        </label>
        <p className="tabular" style={{ fontSize: "var(--sn-step-3)", marginTop: "1cqi" }}>{n} ms</p>
        <button
          type="button"
          onClick={() => setN(350)}
          style={{ marginTop: "1.6cqi", fontSize: "var(--sn-step-0)", padding: "0.8cqi 1.6cqi", borderRadius: "0.6cqi", border: "1px solid var(--sn-rule)", background: "transparent", color: "inherit", cursor: "pointer" }}
        >
          Reset
        </button>
      </Card>
      <p className="muted" style={{ fontSize: "var(--sn-step-1)" }}>
        Focus the button and press Space. It clicks the button; it does not advance the slide. Press Tab away and Space advances.
      </p>
    </Columns>
  );
}

export const example: DeckDef = {
  id: "example",
  title: "Stevenote, an example deck",
  theme: "light",
  transition: "fade",
  totalTime: 180,
  slides: [
    {
      id: "open",
      title: "Stevenote is a presentation tool built as software.",
      theme: "dark",
      notes: { say: "Every slide is a component. The deck is a web app. The notes are in a second window.", do: "Pause. Then advance.", time: 15 },
      content: (
        <Statement kicker="Stevenote">
          <Morph name="title" as="span">A presentation tool built as software.</Morph>
        </Statement>
      ),
    },
    {
      id: "what",
      title: "Four things it does",
      transition: "morph",
      notes: { say: "Four things. Notes in a separate window. Transitions through the View Transitions API. Builds that any component can join. Video with chapters.", do: "One click per line.", time: 30, steps: ["Four things.", "Notes in a window you do not share.", "Transitions from the browser, not a library.", "Builds that any component can join.", "Video with chapters as clicks."] },
      content: (
        <div>
          <p className="muted" style={{ fontSize: "var(--sn-step-1)", marginBottom: "2cqi" }}>
            <Morph name="title" as="span">A presentation tool built as software.</Morph>
          </p>
          <Steps dim>
            <h2 style={{ fontSize: "var(--sn-step-4)" }}>Notes in a window you never share.</h2>
            <h2 style={{ fontSize: "var(--sn-step-4)" }}>Transitions from the browser.</h2>
            <h2 style={{ fontSize: "var(--sn-step-4)" }}>Builds any component can join.</h2>
            <h2 style={{ fontSize: "var(--sn-step-4)" }}>Video with chapters as clicks.</h2>
          </Steps>
        </div>
      ),
    },
    {
      id: "stat",
      title: "350 ms",
      transition: "zoom",
      notes: { say: "A slide change takes three hundred and fifty milliseconds with a steep ease-out. Long enough to read as deliberate, short enough that nobody waits.", do: "Let it count up before speaking.", time: 20 },
      content: <Stat value={350} format={(n) => `${Math.round(n)} ms`} claim="is how long a slide change takes." source="cubic-bezier(0.32, 0.72, 0, 1)" />,
    },
    { id: "push", title: "push", transition: "push", theme: "dark", notes: { say: "Push.", time: 5 }, content: <Statement align="center" kicker="transition">push</Statement> },
    { id: "rise", title: "rise", transition: "rise", notes: { say: "Rise.", time: 5 }, content: <Statement align="center" kicker="transition">rise</Statement> },
    { id: "wipe", title: "wipe", transition: "wipe", theme: "dark", style: { "--sn-bg": "oklch(35% 0.12 260)" } as React.CSSProperties, notes: { say: "Wipe, on a slide with its own background.", time: 5 }, content: <Statement align="center" kicker="transition">wipe</Statement> },
    { id: "blur", title: "blur", transition: "blur", notes: { say: "Blur through.", time: 5 }, content: <Statement align="center" kicker="transition">blur</Statement> },
    {
      id: "video",
      title: "Video with chapters",
      transition: "fade",
      notes: { say: "A video is a slide type. Each click seeks to the next chapter and the label changes.", do: "Click three times.", time: 40 },
      content: (
        <Video
          src="/example/clock.mp4"
          title="Each click is a chapter."
          chapters={[
            { at: 0, label: "Start" },
            { at: 3, label: "Three seconds in" },
            { at: 6, label: "Six seconds in" },
            { at: 8, label: "Near the end" },
          ]}
        />
      ),
    },
    {
      id: "live",
      title: "A live component",
      transition: "fade",
      notes: { say: "Anything React can render can be a slide, and it keeps its keyboard.", do: "Drag the slider. Focus Reset and press Space.", time: 30 },
      content: (
        <LiveFrame title="A live component keeps its own keyboard." subtitle="Space on a focused button clicks the button. Everywhere else it advances.">
          <Playground />
        </LiveFrame>
      ),
    },
    {
      id: "steps-absolute",
      title: "Steps with explicit order",
      notes: { say: "Steps can be out of document order. The right column comes first here.", do: "Three clicks.", time: 20 },
      content: (
        <Columns n={2}>
          <div>
            <Step at={2} effect="fade"><h2 style={{ fontSize: "var(--sn-step-3)" }}>Second</h2></Step>
            <Step at={3} effect="scale"><p style={{ fontSize: "var(--sn-step-1)", marginTop: "1cqi" }}>Third, scaled in.</p></Step>
          </div>
          <div>
            <Step at={1} effect="blur"><h2 style={{ fontSize: "var(--sn-step-3)" }}>First, from the right</h2></Step>
          </div>
        </Columns>
      ),
    },
    {
      id: "close",
      title: "Close",
      theme: "dark",
      transition: "morph",
      notes: { say: "That is the whole tool.", do: "Stop.", time: 10 },
      content: (
        <Statement sub="github.com/diklein/stevenote">
          <Morph name="title" as="span">A presentation tool built as software.</Morph>
        </Statement>
      ),
    },
    {
      id: "bonus",
      title: "Bonus: keys",
      bonus: true,
      notes: { say: "Bonus slide, reachable with End or G.", time: 0 },
      content: (
        <Statement kicker="Bonus slide" sub="Reached with End, or G then 1 2 Enter. Next never lands here.">
          Kept for questions.
        </Statement>
      ),
    },
  ],
};
