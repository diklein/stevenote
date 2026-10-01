#!/usr/bin/env node
/**
 * The other end of the review loop, for whoever edits the deck (a person or an agent).
 *
 *   node scripts/review.mjs watch <review.json>                 one JSON line per submitted slide
 *   node scripts/review.mjs set <review.json> <slide> updating  the deck shows "Updating"
 *   node scripts/review.mjs set <review.json> <slide> done "What changed"
 *                                                               clears the feedback, shows the reply
 */
import fs from "node:fs";

const [cmd, file, slide, status, ...rest] = process.argv.slice(2);
const read = () => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
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
  const entry = { ...prev, status, updatedAt: now };
  if (status === "updating") entry.workingFrom = now;
  if (status === "done") {
    // Clear the feedback only if nobody edited it after the work started; otherwise keep the newer text.
    const untouched = !prev.workingFrom || prev.updatedAt === prev.workingFrom;
    Object.assign(entry, { feedback: untouched ? "" : prev.feedback, reply: rest.join(" ") || null, workingFrom: undefined });
    if (!untouched) console.error(`${slide}: feedback changed while updating, kept it`);
  }
  all[slide] = entry;
  fs.writeFileSync(file, JSON.stringify(all, null, 2) + "\n");
} else {
  console.error("usage: review.mjs watch <file> | set <file> <slide> updating|done [reply]");
  process.exit(1);
}
