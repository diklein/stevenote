# Stevenote

A presentation tool built as software: slides are React components, the deck is a Next.js app, and the craft of the tool is part of the talk.

- Speaker notes in a separate browser window, so a shared Zoom window shows only the slides
- Slide transitions through the View Transitions API: cut, fade, push, rise, zoom, wipe, blur, morph, cube
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

## Live components and backup videos

Anything that talks to a server goes inside `<Live>` with a recording behind it:

```tsx
<Live label="gateway demo" backup={{ src: "/decks/talk/gateway.mp4", poster: "/decks/talk/gateway.jpg" }} check={() => fetch("/api/private/health").then((r) => { if (!r.ok) throw new Error("gateway down"); })}>
  <GatewayDemo />
</Live>
```

The backup takes over when the component throws, when `check` rejects as the slide opens, or when you press `X`. Every switch shows in the notes window. Record the backup against the real servers with:

```
scripts/record-backup.sh "http://localhost:3000/decks/talk#/12" public/decks/talk/gateway.mp4
```

It opens the slide fullscreen in a clean Chrome, counts down, records the screen at 60 fps while you run the demo, stops on Enter, crops to the stage and writes the mp4 and a poster.

While a video plays, everything else on the slide dims to 28 percent, so the eye goes to the moving picture. Turn it off per video with `dimWhilePlaying={false}`.

## Private decks

Deck content and the server routes it needs live in a separate private repo with this shape:

```
src/decks.ts        export const privateDecks: Record<string, DeckDef>
src/api.ts          export const privateRoutes: Record<string, { GET?, POST? }>   served at /api/private/<path>
src/<deck>/...      slides, components, notes
public/...          media, served at /private/<path>
```

Mount it with `npm run link-private -- ../my-decks` (a gitignored symlink at `src/private`). Secrets go in `.env.local`. Without a private repo the app builds with stubs.

## Design system

`/system` renders the type scale, colour tokens, every transition and every step effect with the deck engine itself.

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
| X | swap a live component for its backup video |
| comma | preferences: transition and theme overrides, motion, video dimming, counter, cursor, letterbox, type size, hurry mode |
| ? | help |

Space and Enter on a focused button inside a slide click the button. Keys inside inputs and editors are left alone. Add `data-keyboard-owner` to an element to keep every key.

Notes window: arrows and Space drive the deck, B blanks, R resets the timer, plus and minus change the text size.

## Present over Zoom

Open the deck in its own window, press `S` for notes, share the deck window (not the screen). The notes window can sit anywhere. Both windows keep the same slide and step, and either can navigate. The URL carries the slide and step, so a reload lands where you were.
