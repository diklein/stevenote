---
name: deck-craft
description: Storytelling, slide composition, speaker notes and demo framing for presentations, distilled from building a live-demo keynote and portfolio case studies. Use this whenever the task involves a presentation, slide deck, keynote, talk, portfolio case study presentation, interview presentation, demo script, talk track, speaker or presenter notes, or turning a case study, doc, README or Keynote file into slides, even if the user only says "make a deck" or "review my slides". Also use it when writing copy that will be read aloud or shown on a screen behind a speaker, and when building decks in Stevenote.
---

# Deck craft

A deck is one argument told in pictures, with a person talking over it. Everything below serves that: the slide carries the evidence, the speaker carries the explanation, and the notes carry the timing. This was learned building a 24-slide live-demo keynote over thirty commits in one afternoon, and from a portfolio case study writing guide. The worked examples with the full slide sequence and before-and-after wording live with the private decks, not here.

## 1. Story

Shape the talk before touching a slide. The shape that worked: a person and a problem, the cost, the fix, a bigger fix, then back to the person. Write the shape down in three or four lines with slide ranges, and keep it in the deck's README or DEMO.md, because it is the first thing to drift as slides get added.

- **Open cold on a named person with one question.** No title slide, no agenda, no "who I am" first. "A customer wants one thing. Is it in stock nearby?" A title slide tells the room what they already know. If the talk needs an introduction, it comes after the hook, not before.
- **Name a villain that is not the audience's tool.** In the live-demo deck the villain was the data, never the model, and it was named on slide 4 in three words right after a seven-word setup. The audience needs someone to blame that is not them and not the thing you are selling.
- **Plant a spine line and bring it back.** The spine line opened the talk and returned under the closing point. One line, said twice, is what people repeat afterwards.
- **Give the person a cost.** "She drives across town for something that is not there." Stakes come from a specific person losing something specific, not from a percentage.
- **State the thesis outright, once, on its own slide.** The note on it read "This is the whole talk." If you cannot write the thesis as one sentence, the story is not ready.
- **Live first, explain after.** Run the demo, then the reveal, then the why. The do-note on the first live slide was "Do not explain yet." Explaining before showing turns a demo into a confirmation.
- **Give a worked example before a live run.** A static example teaches the audience what to look for; the live run then proves it. Without the example, the audience watches the demo without knowing what counts as success.
- **Tie it to your own job.** "This is my day job." One line of this makes every claim more credible than a slide of credentials.
- **End on the person, not the product.** "She got the right answer. She never knew there was a question." Then stop. No summary slide, no "thank you" slide, no questions slide.

## 2. Slides

- **One sentence per slide.** The evidence is on the slide, and the explanation is you. If a slide needs a second sentence, it is two slides or the second sentence belongs in the notes.
- **Headlines are the finding itself.** "The snapshot was 41 days old." "One total does not match the other." "The customer exists twice." Never a label ("Problem", "Results", "Why it matters") and never a kicker. Kickers, uppercase tracked labels and "Live" badges were all removed during the build because they told the audience what kind of slide they were looking at instead of what it said.
- **One stat per slide, huge.** A three-column stats slide became three slides: the number at 9 to 13rem, a one-line claim, and a bare source ("Gartner, 2025"). Rounded numbers on the slide ("30%", not "30%+"); the "at least" and the full citation go in the notes. Tie each outside statistic back to the demo the audience just saw.
- **Evidence slides pair one claim with one proof.** A headline plus one card, one screenshot, one rule. Nothing to read while the speaker is speaking.
- **Live numbers beat screenshots.** A number computed during the talk, counted up on entry, is the detail nobody mentions and everyone feels. Say so in the notes: "These numbers are computed right now."
- **No code, SQL, IDs or budgets on slides** unless the code is the point. "No SQL on slides" and "no ids on slides" were separate commits. Monospace is for real identifiers only: a model id, a table name, a URL.
- **Diagrams: four or five nodes and a one-line reading guide, or make them tiles.** Dense diagrams whipsawed through six revisions and the stack diagram ended as five icon tiles. Every diagram that survives gets a title that is a sentence and a subtitle that says how to read it ("Top path: straight to the agent. Bottom path: the checks first, then the same agent.").
- **Data-dense slides get a read-me-first line.** "Left is what A read. Right is what B read."
- **Cut what is not part of the story.** A budget column, a before-and-after line on each role, a surprise slide that took four headline rewrites and still detoured. If a slide keeps needing rewrites, the problem is usually that it does not belong.
- **Light and dark carry the structure.** Dark for the open and the close, light for evidence, live and data in the middle. The background crossfade between them is the only transition the story needs; anything more is decoration.
- **Drop the presenter's name from every slide.** The deck knows who is speaking.
- **Everything stays inside the margins, captions included.** Size a photo to leave room for its caption rather than letting the caption fall into the margin. Only a deliberate full-bleed image may cross them. Check every slide with the overview (O) before calling a pass done.

## 3. Typography on slides

Headlines large, semibold, tight tracking, `line-height` about 1.05, `text-wrap: balance`. Body and list text `text-wrap: pretty` so no lone word sits on a last line. Raise the minimum text size one step above what feels right at a desk; Zoom and projectors eat a size. Diagram and live-frame titles one step smaller than statement headlines. Tabular numerals for anything that counts.

## 4. Notes

Notes have three parts and a time. Keep them as data next to the slide (id, title, say, do, time), never as a parallel list keyed by position, because reordering silently misaligns them.

- **Say** is what you say: first person, plain, declarative, five to twenty words per sentence, no hedges, no em dashes. Fragments only for rhythm. Slightly longer than the slide, never a script to read.
- **Do** is stage direction, imperative and blunt: "Read the slide. Pause. Then advance." "Let the numbers count up before speaking." "Read three of the ten, no more." "Say nothing until both answers land." "Stop." Any do-line that contains a click names the exact button. The presenter view colours click lines amber for a reason.
- **Time** is a per-slide budget: statements 15s, diagrams 25 to 30s, why-slides 25 to 40s, live 45 to 75s. Sum them and compare with the stated length; the live-demo deck's script said seven minutes and the budgets added to eleven.
- **Next** is shown in the presenter view so the speaker can set up the reveal: "The next slide is the reveal."
- Full citations, caveats and the "what if it breaks" fallbacks live in the notes, never on the slide. Scripted silences are notes too.
- End the notes with rehearsal instructions: rehearse once on the real screen from where you will stand, and test the remote on the live slides first.

## 5. Demos

- Frame a live component with a sentence that says what the audience is about to watch, not a label. "Two copies of the same agent answer the same question." An optional subtitle says what to watch for: "The evidence appears first, then what it produced."
- Script the silence and the clicks. A click column in the talk track names buttons.
- Every live slide leads to a why-slide. The demo raises the question; the next slide answers it.
- Write the fallback before the talk: cold start, reset, a recorded video if the server is down. Hand off to a real dashboard at the end if one exists; it proves the demo was real.

## 6. Writing pass

Do two passes after the story is set: a story pass (spine line, costs, the worked example, the read-me-first lines) and a deslop pass. Deslop rules learned the hard way:

- Staccato fragments read as slop on a screen. "Same tool. Same input. Same question." became "The same tool, the same input, the same question."
- Remove "not X but Y" contrasts and aphorisms. "A page at dawn, not a thread at noon" became "Gets paged at dawn with the owner named." An aphorism about the rule being the only honest thing in the loop became "Only the rule saw it coming."
- Plain words beat clever ones. "Metadata in, rule out." became "Metadata goes in and a rule comes out." A surprise-slide headline went through four rewrites and the winner was the plainest: "The answer looked right. The data was already broken."
- Trim until the line is only the point. A tile line shrank from "Runs the agents and saves every conversation as it happens" to "Runs the agents."
- Semicolons become two sentences or a comma and "and". No em dashes anywhere, in slides, notes or docs.
- Design goals are not outcomes. "Users build confidence that AI can do the task" is intent unless measured; label it as intent or replace it with the measured figure.

## 7. Reviewing an existing deck

When asked to review or fix a deck, work slide by slide and produce a table with columns: slide, what it says now, problem, fix. Then rewrite the copy for every slide you flag, and draft say, do and time notes for the slides that have none. Lead the review with the three structural changes that matter most (usually the open, the thesis and the close), because slide-level fixes do not help a deck with the wrong shape. Check the sums: total time against the slot, and every number against its source (hiring managers cross-check numbers).

## 8. Process

Build in rounds and screenshot every round; the live-demo deck has forty screenshots from one afternoon and each round was reviewed before the next. Story pass, then deslop pass, then a presenter-view pass with the notes visible, then a rehearsal on the real screen. Keep the shape and the fallbacks in a DEMO.md next to the deck.
