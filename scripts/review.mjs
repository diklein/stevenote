#!/usr/bin/env node
/**
 * The other end of the review loop, for whoever edits the deck (a person or an agent).
 *
 *   node scripts/review.mjs watch <review.json>                 one JSON line per submitted slide
 *   node scripts/review.mjs set <review.json> <slide> updating  the deck shows "Updating"
 *   node scripts/review.mjs set <review.json> <slide> done "What changed"
 *                                                               clears the feedback, shows the reply
 *   node scripts/review.mjs log <review.json> [slide]           every change ever made, oldest first
 *   node scripts/review.mjs rebuild <review.json>               fold the journal back into the snapshot
 *
 * Every change is appended to the journal beside the snapshot (<review>.jsonl) before the snapshot is
 * rewritten, so an edit can never lose an earlier one: `rebuild` replays the journal. This script and the
 * /api/private/review route are the only things that should write either file. Never edit them by hand.
 */
import fs from "node:fs";

const [cmd, file, slide, status, ...rest] = process.argv.slice(2);
const journalFile = () => file.replace(/\.json$/, ".jsonl");
const read = () => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
};
const lines = () => {
  try {
    return fs.readFileSync(journalFile(), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
};
/** Append one change; a snapshot without a journal yet is journaled first so nothing before today is lost either. */
const journal = (line, current) => {
  if (!fs.existsSync(journalFile()) && Object.keys(current).length) fs.appendFileSync(journalFile(), JSON.stringify({ at: new Date().toISOString(), snapshot: current }) + "\n");
  fs.appendFileSync(journalFile(), JSON.stringify(line) + "\n");
};
const writeSnapshot = (data) => {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file);
};
/** The snapshot the journal describes: the latest full snapshot line, then every patch after it. */
const fold = () => {
  let out = {};
  for (const l of lines()) {
    if (l.snapshot) out = structuredClone(l.snapshot);
    else if (l.slide) out[l.slide] = { ...out[l.slide], ...l.patch };
  }
  return out;
};

if (cmd === "watch" && file) {
  const seen = new Set();
  const tick = () => {
    for (const [id, r] of Object.entries(read())) {
      const key = `${id}@${r.updatedAt}`;
      if (r.status === "submitted" && !seen.has(key)) {
        seen.add(key);
        process.stdout.write(JSON.stringify({ slide: id, feedback: r.feedback ?? "" }) + "\n");
      }
    }
  };
  tick();
  setInterval(tick, 1000);
} else if (cmd === "set" && file && slide && (status === "updating" || status === "done")) {
  const all = read();
  const prev = all[slide] ?? {};
  const now = new Date().toISOString();
  const patch = { status, updatedAt: now };
  if (status === "updating") patch.workingFrom = now;
  if (status === "done") {
    // Clear the feedback only if nobody edited it after the work started; otherwise keep the newer text.
    const untouched = !prev.workingFrom || prev.updatedAt === prev.workingFrom;
    Object.assign(patch, { feedback: untouched ? "" : prev.feedback, reply: rest.join(" ") || null, workingFrom: undefined });
    if (!untouched) console.error(`${slide}: feedback changed while updating, kept it`);
  }
  journal({ at: now, slide, patch, by: "review.mjs" }, all);
  all[slide] = { ...prev, ...patch };
  writeSnapshot(all);
} else if (cmd === "log" && file) {
  for (const l of lines()) {
    if (l.snapshot) {
      const n = Object.keys(l.snapshot).length;
      console.log(`${l.at}  snapshot of ${n} slide${n === 1 ? "" : "s"}`);
    } else if (!slide || l.slide === slide) {
      const p = { ...l.patch };
      delete p.updatedAt;
      console.log(`${l.at}  ${l.slide.padEnd(18)} ${JSON.stringify(p)}${l.by ? `  (${l.by})` : ""}`);
    }
  }
} else if (cmd === "rebuild" && file) {
  const folded = fold();
  const current = read();
  const lost = Object.keys(current).filter((k) => !(k in folded));
  if (!lines().length) {
    console.error(`no journal at ${journalFile()}; nothing to rebuild from`);
    process.exit(1);
  }
  writeSnapshot(folded);
  console.log(`rebuilt ${file} from ${lines().length} journal lines: ${Object.keys(folded).length} slides` + (lost.length ? `; slides only in the old snapshot, now dropped: ${lost.join(", ")}` : ""));
} else {
  console.error("usage: review.mjs watch <file> | set <file> <slide> updating|done [reply] | log <file> [slide] | rebuild <file>");
  process.exit(1);
}
