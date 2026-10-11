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
  letterbox: "stage",      // the surround on a wide screen: "black" (default) or the slide's own colour
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

Video: `<Video src poster chapters={[{ at: 0, label }, { at: 12, label }]} />`. Each chapter after the first is a click. It plays on entry, pauses on exit and holds the last frame. `loop` keeps a short clip moving for as long as the slide is up. `controls` makes the picture clickable: a click pauses or resumes, a slim scrubber appears along the bottom edge while the pointer is over it or the video is paused, and K, J and L pause, scrub back and scrub forward.

Tokens: override per slide with `style={{ "--sn-bg": "oklch(35% 0.12 260)" }}`. The type scale is `--sn-step--1` through `--sn-step-6`.

Notes: `say`, `do`, `time` in seconds, and optional `steps` (one say-chunk per click). A `say` with line breaks is talking points: the notes window shows one bullet per line, and a single line stays a paragraph. Slides marked `skippable` are hidden in hurry mode; slides marked `bonus` sit after the end for questions.

## The grid

Every slide sits on a twelve-column grid built from one unit, the baseline (1.25cqi): margins of four baselines, gutters of one. Type sizes are whole or half baselines (`--sn-step--1` at 1 to `--sn-step-6` at 10) and line heights are whole baselines, so the type size preference scales the baseline and everything stays aligned. `Grid` and `Col` place content (`<Col span={7}>`, `<Col span={5} start={8}>`); the built-in layouts already use them. Type steps come with line heights that are whole baselines (`--sn-lh-0` to `--sn-lh-6`), and spacing should be in baselines too (`calc(var(--sn-base) * 2)`). Press `G` to see the overlay, or open a deck with `?grid=1`.

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

The notes window mirrors the current slide live: it animates, plays video and takes clicks, so a prototype stepped there steps the deck. A `<Live>` component is not mounted twice; in the notes window it shows a placeholder with a button per entry in `triggers`, and an optional `still` image. Pressing a button fires the same handler on the deck through `useTriggers({ "Stock check": () => ask() })` inside the component.

While a video plays, everything else on the slide dims to 28 percent, so the eye goes to the moving picture. Turn it off per video with `dimWhilePlaying={false}`.

## Private decks

Deck content and the server routes it needs live in a separate repo, kept out of this one. Start from the
template, which has a first deck and the review route:

```
git clone https://github.com/diklein/stevenote-decks-template.git my-decks
npm run link-private -- ../my-decks
```

The shape:

```
src/decks.ts        export const privateDecks: Record<string, DeckDef>
src/api.ts          export const privateRoutes: Record<string, { GET?, POST? }>   served at /api/private/<path>
src/<deck>/...      slides, components, notes
public/...          media, served at /private/<path>
review/             per-slide feedback and approvals, written by the review route
```

`link-private` symlinks `src/private` and `public/private` here to the decks repo and gives it this app's
`node_modules`. Without a decks repo, install writes stubs so the app builds with only the example deck.

## Set up with Claude Code

Paste this into Claude Code in an empty folder:

```
Set up Stevenote for me. It is a presentation tool where slides are React
components and the deck is a Next.js app: https://github.com/diklein/stevenote

1. Clone it into ./stevenote, run npm install, then npm run dev. Open
   http://localhost:3000 and confirm the "example" deck loads.
2. Read README.md and skills/deck-craft/SKILL.md before writing any slide.
   Use the deck-craft skill for story, slide composition and speaker notes.
3. Clone https://github.com/diklein/stevenote-decks-template.git into
   ./my-decks and mount it: cd stevenote && npm run link-private -- ../my-decks
   Deck content goes there, never in the stevenote repo.
4. Build my first deck from [a doc, README, outline or Keynote file, or a
   description of the talk]. Copy src/hello, change the id, register it in
   src/decks.ts. Speaker notes go in notes.say as talking points, one line
   per bullet, with notes.time in seconds.
5. Show me the deck at http://localhost:3000/decks/<id>, tell me to press S
   for the notes window and ? for the keys, and wait for my feedback. Do not
   push anything.
```

## Review

Press `/` on any slide for a feedback panel. Esc closes and keeps the draft; ⌘Enter submits it, and the corner shows Submitted, then Updating, then Updated with a reply. Whoever edits the deck watches for submissions with `node scripts/review.mjs watch <review.json>` and reports progress with `node scripts/review.mjs set <review.json> <slide> updating|done "reply"`; done clears the feedback unless it changed while the work was underway. The page polls, so the flag follows along live. `A` toggles the slide's approval; `⇧A` shows or hides the flags in the corner (the submit status while one is in flight; Updated and the approval check fade after ten seconds). Turn on Approval badges in preferences to keep an Approved or Not approved badge on every slide. The notes window shows both. The deck stores nothing: it reads and writes `/api/private/review?deck=<id>`, which a private decks repo implements against its own files (see the decks repo's `src/api.ts`): a journal of every change (`review/<deck>.jsonl`, append-only) and a snapshot folded from it (`review/<deck>.json`). `node scripts/review.mjs log <review.json> [slide]` prints the history and `rebuild` restores the snapshot from the journal. Never edit the files by hand. Without that route the browser's localStorage holds the review; with it, localStorage keeps a mirror as one more copy.

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
| digits, Enter | jump to a slide |
| minus | hurry mode (skips `skippable` slides) |
| X | swap a live component for its backup video |
| K, J, L | pause or play a video with `controls`, scrub it five seconds back or forward |
| comma | preferences: transition and theme overrides, motion, video dimming, counter, cursor, letterbox, type size, hurry mode |
| slash, A, Shift+A | feedback panel, approve this slide, show or hide review flags |
| G | grid overlay |
| O | overview: every slide in a grid, grouped by `section`, with its review state; click or Enter goes there, / searches titles, U and F filter to not approved or with feedback |
| ? | keyboard shortcuts, in tabs for presenting, reviewing and the slide grid; built from the same table as the key handling (`BINDINGS` in keyboard.ts) |

Space and Enter on a focused button inside a slide click the button. Keys inside inputs and editors are left alone. Add `data-keyboard-owner` to an element to keep every key.

Notes window: arrows and Space drive the deck, B blanks, R or the Reset button restarts the timer, plus and minus change the text size.

## Present over Zoom

Open the deck in its own window, press `S` for notes, share the deck window (not the screen). The notes window can sit anywhere. Both windows keep the same slide and step, and either can navigate. The URL carries the slide and step, so a reload lands where you were.
