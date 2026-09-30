# Stevenote

A presentation tool built as software: slides are React components, the deck is a Next.js app, and the craft of the tool is part of the talk.

- Speaker notes in a separate browser window, so a shared Zoom window shows only the slides
- Slide transitions through the View Transitions API: cut, fade, push, rise, zoom, wipe, blur, morph
- Builds: any component can be a click, in document order or at an explicit position
- Typography and colours as tokens per deck and per slide, sized in container units so text lays out natively at any window size
- Video as a slide type, with chapters as clicks
- Live React components on any slide, and they keep their own keyboard

Research behind it: `RESEARCH.md`. The `skills/` folder holds the deck-craft skill (storytelling, slide composition, notes). Deck content lives outside this repo; only the software and skills are public.

## Run

```
npm install
npm run dev
```

Open http://localhost:3000, pick a deck, press `?` for the keys and `S` for the notes window.

## Write a deck

A deck is a `DeckDef` registered in `src/decks/index.ts`. See `src/decks/example/deck.tsx`.

```tsx
export const talk: DeckDef = {
  id: "talk",
  title: "My talk",
  theme: "light",          // or "dark"; each slide may override
  transition: "fade",      // each slide may override
  slides: [
    {
      id: "open",
      title: "Shown in the notes window",
      theme: "dark",
      transition: "morph",
      notes: { say: "What you say.", do: "Click once.", time: 20 },
      content: <Statement kicker="Kicker">One sentence.</Statement>,
    },
  ],
};
```

Layouts: `Statement`, `Stat` (counts up on entry), `Evidence`, `LiveFrame`, `Columns`, `Card`, `Media`, `Video`.

Builds: wrap anything in `<Step>` (document order) or `<Step at={3}>`; `<Steps>` wraps each child. Components can join with `useStep()` or own several clicks with `useStepSpan(n)`. Effects: `up`, `fade`, `scale`, `blur`, `highlight`, `none`; `dim` fades past steps.

Morph: give an element `<Morph name="title">` on two consecutive slides and set the second slide's transition to `morph`.

Video: `<Video src poster chapters={[{ at: 0, label }, { at: 12, label }]} />`. Each chapter after the first is a click. It plays on entry, pauses on exit and holds the last frame.

Tokens: override per slide with `style={{ "--sn-bg": "oklch(35% 0.12 260)" }}`. The type scale is `--sn-step--1` through `--sn-step-6`.

Notes: `say`, `do`, `time` in seconds, and optional `steps` (one say-chunk per click). Slides marked `skippable` are hidden in hurry mode; slides marked `bonus` sit after the end for questions.

## Keys

| Key | Does |
| --- | --- |
| Right, Space, PageDown, Enter, N | next step or slide |
| Left, Shift+Space, PageUp, Backspace, P | back |
| Home, End | first slide, last non-bonus slide |
| B or period, W | blank to black, to white |
| S or Shift+N | open the notes window |
| F | fullscreen |
| G, digits, Enter | jump to a slide |
| minus | hurry mode (skips `skippable` slides) |
| ? | help |

Space and Enter on a focused button inside a slide click the button. Keys inside inputs and editors are left alone. Add `data-keyboard-owner` to an element to keep every key.

Notes window: arrows and Space drive the deck, B blanks, R resets the timer, plus and minus change the text size.

## Present over Zoom

Open the deck in its own window, press `S` for notes, share the deck window (not the screen). The notes window can sit anywhere. Both windows keep the same slide and step, and either can navigate. The URL carries the slide and step, so a reload lands where you were.
