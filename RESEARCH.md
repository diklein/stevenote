# Stevenote research

How to build an extremely high quality browser presentation tool, and what it should be. Written 2026-09-29 for portfolio case study talks. Sources are listed at the end; claims marked (unverified) could not be confirmed and should be tested on Dave's machine.

## 1. The bar

Vercel's design engineering principles: "Own the whole experience... every state, edge case, word, and interaction," "Make it excellent. Scope small enough to do it well," "complexity available, not required." The team blog describes the job as "polished interactions, no dropped frames, no cross-browser inconsistencies" and "there is a lot of work behind the pretty pixels." Rauno Freiberg: "Work with the material... HTML, CSS, and JavaScript. The ingenuity lies in solving a problem with what's available, not introducing more." Paco Coursey: "Poor design manifests as slowness."

So the tool is judged the way Vercel judges product UI: every keystroke responds instantly, every transition is deliberate, nothing drops a frame on a shared Zoom window, and the whole thing is built from the web platform rather than a pile of dependencies. The deck must be good enough that a slide about how it was made is itself a credible portfolio piece.

## 2. Who builds talks as software, and what to take from them

### Marcin Wichary

Wichary has built his slides as HTML apps for about 20 years and wrote the original Google HTML5 slide template. His Medium series "The rectangle behind you" is the canonical text. The ideas that transfer:

- **The presentation is an app.** "With your presentation being an app, you are working with a universal Turing machine: if you need anything, anything at all, you can build it yourself." Iframed live sites, editable fields, sliders that change video speed, live coding inside a slide, an audience voting system.
- **Treat it as a prototype.** "I treat all my presentations as prototypes. The code is good enough just so that it works one time, under very specific circumstances." One browser, one resolution, requested from the organizers ahead of time.
- **Engine checklist.** Slide number in the URL so Cmd+R reloads in place. State in localStorage. Fully offline: local fonts, local images, screencast backups of anything external. `cursor: none` with a parking rectangle that also reclaims keyboard focus. Rewind must not replay animations. Shift skips animations during development. Guard shortcuts with `document.activeElement == document.body` so typing in an input never advances a slide. Preload iframes as you approach them, unload after. A 450ms debounce against remotes that double fire.
- **Secret shortcuts.** "You can use the user interface that's there right below your screen: a keyboard." A running-out-of-time mode on one key that hides slides marked skippable. Bonus slides kept past the end for Q&A: "like having a cheat sheet with you during the exam." Section jumps on Shift+Ctrl+number for branching. For shortcuts with no visible effect, "quickly blink a little rectangle" as feedback.
- **State persists across slides.** Something typed on one slide can come back on a later one. Custom transitions "unavailable anywhere else." A fallback that shows a pre-recorded video if the live server is down.
- **Test like a stage tech.** Ask organizers for projector resolution, number of screens, confidence monitor, remote. Test dark, light grey and photo slides. Check video frame rate. "Go through at least a few slides with the remote" from the real distance.
- **Config 2024, "In defense of an old pixel"**: all custom code, JS and canvas plus Node, with a live segment where the audience submitted pixel-font letters that moderators filtered before they appeared on stage.

### Others

- **Lea Verou** wrote CSSS in 2010 and rewrote it as Inspire.js (3.0.1 in June 2026, used for TC39 and TPAC decks). Ctrl+P splits one window into presenter and projector, `delayed` classes are build steps, `data-duration` drives a timer, `@scope` gives slide-local CSS.
- **Jake Archibald** built `preso` (with Surma) for the HTTP 203 talks, on GSAP and hyperHTML.
- **Josh Comeau** used Spectacle plus code slides for React Europe 2018, then a fully custom React and MDX build with over 100MB of media and a Storybook for 2020.
- **Jhey Tompkins**, formerly a Vercel design engineer, builds talks in the browser, controls slides by voice and hand gesture from his phone, and lets the audience pop emojis over the slides. "Building slide decks is hard... Why not do it in the browser?"
- **Anthony Fu** built Slidev because he "couldn't stand trying to get code to look right in Keynote."
- **Hakim El Hattab** wrote reveal.js and runs Slides.com on it. Cassie Evans, Sarah Drasner, Kent C. Dodds and Dan Abramov present from Slides.com rather than custom code.
- **Bret Victor**'s demos are "just some Javascript and HTML cooked up to do just the things that he showed."

Few teams have a documented custom-slides practice, which makes a well-built one stand out rather than blend in.

### The slide about the tool

The material above is enough for one strong slide, or a short section, in the talk: the lineage (Wichary, Verou, Archibald, Fu, Tompkins), the two ideas that make it worth doing (the presentation is an app; the tool is a prototype built for one room), and then the specifics of this tool: the notes window protocol, the transition system, the typography scale, the video pipeline. Show the deck's own source for the slide being shown, live.

## 3. Tools worth stealing from

| Tool | Steal this | Weak spot |
| --- | --- | --- |
| reveal.js 6 | Auto-Animate: matches elements by `data-id` or identical text, interpolates position, size, color, padding and font size; per-slide easing and duration. Speaker view protocol (connect, heartbeat, reconnect). Fragment vocabulary (`current-visible`, grouped indices). `G` jump-to-slide. | Scaled fixed canvas blurs text. Recognisable default look. |
| Slidev | Shiki Magic Move for code (token diff, FLIP, stagger, per-block duration). `v-click` with absolute, relative and range positions. Presenter mode with click markers that highlight the note chunk for the current step. Screen mirror pane. BroadcastChannel sync in built mode, keyed by deck so two decks don't cross talk. Playwright PDF export with `--with-clicks`. | Markdown-first authoring caps layout ambition. Heavy toolchain. |
| Keynote | Presenter display: current, next build state (not just next slide), notes, ready-to-advance light, clock, timer. Builds model: On Click, After Transition, After Build, with delays. Magic Move as the continuity reference. Rehearse mode with per-slide timing. | Code and live anything. |
| Inspire.js | One window split into presenter and projector on a keystroke. Slide-local CSS via `@scope`. | Small ecosystem. |
| Motion Canvas | `beginSlide()` pauses a timeline until Space. | No live interactivity. |
| Figma Slides, Pitch, Gamma | Presenter view with editable notes, live polls, per-slide analytics, "spotlight" blur of unrevealed blocks. | Closed. |
| open-slide, Bento (2026) | Each slide is a 1920×1080 React component; single-file HTML deck with GSAP Flip transitions. | New and thin. |

MDX Deck and Tome are dead. Spectacle is maintained but dated.

## 4. What Stevenote should be

### Stack

Next.js 16 App Router, React 19.3, TypeScript, Tailwind v4, Motion. This matches Platinum and the earlier deck, deploys to Vercel in one step, and gives `next/font`, MDX and Server Components for free. React 19.3 ships `<ViewTransition>` and `addTransitionType`, which is the right primitive for direction-aware slide transitions.

One dependency rule: nothing added that the platform already does. View Transitions, BroadcastChannel, container queries, `text-wrap`, `<video>`, the Fullscreen API and the Window Management API cover most of the feature list.

### Authoring model

A deck is a folder: `decks/<slug>/deck.mdx` plus `notes`, media and any bespoke components. Slides are separated by `---` in MDX with per-slide frontmatter (layout, theme, transition, timing, notes). Any slide can drop to TSX. Layout components form a small vocabulary that the earlier deck already proved: `Statement`, `Stat`, `Evidence`, `LiveFrame`, plus new `Media`, `Compare`, `Steps`, `Code`. Notes live next to the slide, not in a parallel array keyed by index (that drift is the top bug in the the earlier deck deck).

### Canvas and typography

A 16:9 stage: `width: min(100vw, 100vh * 16 / 9)` with `container-type: size`, letterboxed in the deck background colour. Every size in the deck is in `cqi` units so type lays out natively at any window size, with no transform scaling and no blur. Type scale as tokens: `--step-0` through `--step-5`, defined once per deck and overridable per slide. Fonts self-hosted through `next/font`, all weights preloaded on the title slide, navigation enabled only after `document.fonts.ready`. `text-wrap: balance` on headings, `pretty` on body. Tabular numerals on anything that counts. `-webkit-font-smoothing: antialiased` only on dark slides (macOS thickens light-on-dark text). Colour tokens in OKLCH so a per-slide background swap keeps perceived contrast.

Zoom's encoder is the last mile: sizes and weights need to be one notch heavier than a native deck would use.

### Transitions

Built on the View Transitions API. Same-document transitions are Baseline (Chrome 111, Safari 18, Firefox 144). Chrome-only extras (`view-transition-class`, types, nested groups, `match-element`) are feature-detected with `CSS.supports`.

Menu, chosen per deck and overridable per slide:

- **cut**: none.
- **fade**: crossfade, 250ms.
- **push**: horizontal or vertical slide, direction follows forward or back, 350ms `cubic-bezier(0.32, 0.72, 0, 1)`.
- **zoom**: 0.96 to 1 with fade, 300ms.
- **morph**: shared elements carry across slides. Matching by `view-transition-name`, with a Motion `layoutId` path for elements that must stay interactive mid-flight (VT freezes snapshots).
- **wipe**: `clip-path` inset or circle, 400ms.
- **blur-through**: old blurs and fades, new un-blurs. Gated to a transform and opacity fallback above 1440p, since blur is the first thing to drop frames on a 4K display.

Rules: transform and opacity only; `will-change` only on the two slides in flight; the next slide is pre-rendered and `inert` so the update inside `startViewTransition` is a class flip, not a mount; exits run 20 to 30 percent faster than enters; `prefers-reduced-motion` swaps everything for a 120ms crossfade rather than a hard cut, which reads as a glitch on a shared screen. Full-bleed slide changes at 300 to 450ms read as deliberate; builds inside a slide at 200 to 300ms.

Code morphs use shiki-magic-move.

### Builds

A step is a click. State is `{ slide, step }`, mirrored in the hash as `#/12/3`. `pushState` on slide change, `replaceState` on step change, so browser Back means previous slide. A per-slide `StepProvider` and a `useStep(at)` hook returning `{ active, current }`. Positions can be absolute (`at={3}`), relative (`at="+1"`) or a range (`at={[2, 4]}`), the Slidev vocabulary. Any component can register its own step count (a code walkthrough with six highlights registers six), so the keyboard only ever calls `next()`. Registration happens in a layout effect so the count is right before first paint. Chained sub-animations within one click are CSS delays. Rewinding never replays a build.

### Notes window

Separate window opened from a click with `window.open(url, "stevenote-notes", "popup,width=1280,height=800")`, which gets its own frame with no tabs or omnibox and appears as its own entry in Zoom's window picker. The presenter shares the slide window, never the screen.

Transport: BroadcastChannel keyed by deck slug, carrying `{ deckId, slide, step, blanked, seq, ts }`. Receivers ignore stale `seq`. The same object is mirrored to localStorage so a window that opens or reloads late hydrates instantly, and a `hello`/`state` handshake plus a two-second heartbeat lets either side detect the other's reload and resend. Either window can originate navigation, since focus lives in the notes window half the time. Both windows write the same hash.

Layout, taken from Keynote's presenter display: current slide rendered live at small scale (same components, `inert`), next build state, notes with the chunk for the current step highlighted, "step 2 of 5", elapsed and wall clock, per-slide time budget with on-pace, behind and ahead colour, a ready-to-advance indicator while a transition or video is running, and the text-size control from the earlier deck. Video slides show time remaining.

Progressive enhancement with the Window Management API on Chrome: one click can place the notes window on the built-in display and put the slides fullscreen on the external one. Document Picture-in-Picture as an optional floating notes card on a single-screen laptop (whether Zoom hides it is unverified).

Do not build on the W3C Presentation API. Chrome's implementation targets Cast, Mac support for wired displays never clearly shipped, and Safari and Firefox have none.

### Video

Case studies are mostly screen recordings, so video is a first-class slide type, not an embed.

- `<video>` with `playsinline muted`, a poster, and `preload="auto"` on the next slide's video one slide ahead. Play on slide enter, pause on leave, resume position on return, restart on a key.
- **Chapters as steps.** A video declares timestamps; each click seeks to the next chapter and the notes show the chapter name. This replaces "Video" as a bullet.
- Hold last frame by default, loop as an option, playback rate as an option (Wichary's slider), scrub with a key held.
- Pipeline: masters are 3204×2048 60fps H.264 screen recordings. Encode two renditions per video, 1920-wide H.264 for compatibility and HEVC or AV1 at the same size for quality, with a JPEG poster. Zoom re-encodes shared video at roughly 30fps at best; the "Optimize for video clip" share option should be on for video-heavy sections.
- Offline: videos are local files served by the app, never a CDN, per Wichary.

### Live code and interactive components

- Static code: Shiki at build time. Stepped code: shiki-magic-move.
- Editable code: CodeMirror 6, not Monaco (150KB versus multiple megabytes and a seconds-long first interaction). Sandpack for full sandboxes with the bundler self-hosted for offline. react-live for "edit this prop and watch the component" slides, wrapped in an error boundary.
- Interactive React components render in-page and share tokens and steps. Iframes only for demos of deployed apps, and they cannot join steps or transitions.
- Mount window: current, previous and next mounted; heavy components mount one slide ahead and unmount two slides away; a `keepAlive` flag preserves demo state for slides you return to.

### Keyboard and remote

Bind the union of reveal.js, Slidev and clicker keys via `event.key`: PageDown, Right, Space, Enter, N for next; PageUp, Left, Backspace, P for previous; Shift as the universal back modifier; B or period for blank (broadcast so notes shows BLANKED); Esc leaves blank or overview but never the presentation; F fullscreen; G then digits then Enter to jump; S opens notes; O overview grid; question mark for help; minus enters running-out-of-time mode which hides slides marked `skippable`. Logitech clickers send PageUp and PageDown; the Spotlight may send arrows (unverified). Keys are ignored when focus is in an editor unless a modifier is held, and Space or Enter on a focused button inside a live slide must click the button (a real bug in the the earlier deck deck). Laser dot and spotlight overlays broadcast in slide-relative units so they show in the notes window too. Swipe on touch.

### Export

A print route renders every `(slide, step)` pair as a fixed 1920×1080 block with transitions off and videos replaced by posters; Playwright prints it with `@page { size: 1920px 1080px }` and `preferCSSPageSize`. decktape as a no-code fallback. Case study PDFs are a likely ask.

### Offline and rehearsal

Everything local: fonts, images, videos, the Sandpack bundler. A rehearsal mode records actual per-slide times against budgets and stores them, as Keynote's Rehearse does. Wichary's test list (dark, light grey and photo slides on the real display, remote from the real distance, Wi-Fi off) becomes a checklist in the README.

## 5. What we keep from the earlier deck engine and what we fix

Keep: the `Deck` engine shape, `Statement` and `LiveFrame`, the BroadcastChannel presenter window with time budget and amber "do" cues, the popup-blocked fallback, `inert` on inactive slides, hash sync, the eased count-up with reduced-motion, `text-wrap` rules scoped to the deck, the light and dark rhythm carrying the story.

Fix: everything mounts at load so the score count-up plays before anyone sees it; Space and Enter are captured deck-wide and steal clicks from buttons in live slides; notes are looked up by index while slides are merged by id; dark slides hardcode colours instead of switching tokens; `transition-all` with one ease and no reduced-motion path; the channel effect is torn down on every index change; no steps, no fullscreen, no overview, no touch, no export, no 16:9 stage.

## 6. Build plan

1. **Stage and engine.** 16:9 container, cqi type scale, tokens, MDX deck loader, hash state, keyboard map, mount window. One example deck.
2. **Notes window.** Protocol, layout, timer, budgets, rehearsal log.
3. **Transitions and steps.** View Transitions with the menu above, `useStep`, magic move for elements and code.
4. **Media.** Video slide type with chapters, encoding script, image slides with lightbox-style zoom.
5. **Live.** Shiki, CodeMirror, react-live, Sandpack, iframe.
6. **Export and polish.** Print route, overview grid, laser and spotlight, skippable and bonus slides, help overlay, offline check.
7. **The first real deck**, then the slide about the tool.

## 7. Open questions for Dave

See the end of the conversation summary; the questions are about deployment privacy for gated case studies, the room (single laptop over Zoom, or a second display), the typeface, the target length, pilot results for the case study, and which video cuts to use.

## Sources

- Wichary, "The rectangle behind you" series: https://medium.com/the-rectangle-behind-you/the-rectangle-behind-you-103179fcfc32 (index); why HTML: https://medium.com/the-rectangle-behind-you/the-rectangle-behind-you-why-i-do-my-presentation-slides-in-html-and-so-should-you-10ed3c2b8050; benefits: https://medium.com/the-rectangle-behind-you/the-rectangle-behind-you-examples-of-benefits-of-using-html-for-slides-649e4f9fb763; engine checklist: https://medium.com/the-rectangle-behind-you/the-rectangle-behind-you-checklist-for-writing-an-html-slide-engine-7a3fc1e1dfa8; Webstock source: https://medium.com/the-rectangle-behind-you/the-source-code-for-my-webstock-2017-slides-1fcda357d27f; secret shortcuts: https://medium.com/the-rectangle-behind-you/the-rectangle-behind-you-secret-keyboard-shortcuts-be7a1574ab0; skip and bonus slides: https://medium.com/the-rectangle-behind-you/the-rectangle-behind-you-skip-slides-and-bonus-slides-4493ad863f55; remote: https://medium.com/the-rectangle-behind-you/the-rectangle-behind-you-building-your-own-presentation-remote-981058118cd7; testing: https://medium.com/the-rectangle-behind-you/the-rectangle-behind-you-testing-the-presentation-a6646b256fb5; Config 2024: https://www.youtube.com/watch?v=SDI8ubVZi7w and https://mastodon.online/@mwichary/112708227593945648
- Inspire.js: https://inspirejs.org/ ; preso: https://github.com/jakearchibald/preso ; Comeau 2020 deck: https://github.com/joshwcomeau/talk-2020-react-europe ; Jhey Tompkins: https://shiftmag.dev/tech-talk-jhey-tompkins-804/ ; Anthony Fu on Slidev: https://www.lastweekinaws.com/podcast/screaming-in-the-cloud/slide-into-the-future-of-presentations-with-anthony-fu/
- Vercel design engineering: https://vercel.com/design/engineer ; https://vercel.com/blog/design-engineering-at-vercel ; Ship platform: https://vercel.com/blog/designing-and-building-the-vercel-ship-conference-platform ; Rauno: https://spaces.is/loversmagazine/interviews/rauno-freiberg ; Paco: https://ui.land/interviews/paco-coursey ; Emil: https://emilkowal.ski/ui/great-animations
- reveal.js: https://revealjs.com/auto-animate/ , https://revealjs.com/speaker-view/ , https://revealjs.com/fragments/ , https://revealjs.com/keyboard/ ; Slidev: https://sli.dev/guide/animations , https://sli.dev/features/shiki-magic-move , https://sli.dev/guide/ui , https://sli.dev/guide/exporting.html ; Keynote presenter display: https://support.apple.com/guide/keynote/present-on-a-separate-display-tana4da2681/mac ; Keynote builds: https://support.apple.com/guide/keynote/change-build-order-and-timing-tan3ad5f8d82/mac
- View Transitions: https://developer.chrome.com/blog/view-transitions-in-2025 , https://caniuse.com/view-transitions , https://developer.chrome.com/docs/css-ui/view-transitions/nested-view-transition-groups , https://www.bram.us/2025/02/07/view-transitions-applied-more-performant-view-transition-group-animations/ ; React 19.3: https://react.dev/blog/2026/09/09/react-19-3 ; Motion layout: https://motion.dev/docs/react-layout-animations ; GSAP Flip: https://gsap.com/docs/v3/Plugins/Flip/ ; shiki-magic-move: https://shiki.style/packages/magic-move
- Windows: https://caniuse.com/broadcastchannel , https://developer.chrome.com/docs/capabilities/web-apis/window-management , https://developer.chrome.com/docs/web-platform/document-picture-in-picture/ , https://developer.mozilla.org/en-US/docs/Web/API/Presentation_API ; Zoom window share: https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060596
- Code: https://sandpack.codesandbox.io/docs/guides/hosting-the-bundler , https://github.com/FormidableLabs/react-live , https://sourcegraph.com/blog/migrating-monaco-codemirror
- Type: https://moderncss.dev/container-query-units-and-fluid-typography/ , https://nextjs.org/docs/app/api-reference/components/font , https://dbushell.com/2024/11/05/webkit-font-smoothing/ , https://caniuse.com/mdn-css_properties_text-wrap_pretty
- Export: https://playwright.dev/docs/api/class-page , https://github.com/astefanutti/decktape
