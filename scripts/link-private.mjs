// Mounts a private decks repo: src/private -> <repo>/src (decks.ts, api.ts, deck folders) and
// public/private -> <repo>/public (media, served at /private/...).
// The path is gitignored, so the public repo never carries deck content.
import { existsSync, lstatSync, rmSync, symlinkSync } from "node:fs";
import { resolve, join } from "node:path";

const target = process.argv[2];
if (!target) {
  console.error("usage: npm run link-private -- <path to private repo>");
  process.exit(1);
}
const repo = resolve(target);
const links = [
  [join(process.cwd(), "src", "private"), join(repo, "src")],
  [join(process.cwd(), "public", "private"), join(repo, "public")],
];
for (const [link, dest] of links) {
  if (!existsSync(dest)) {
    console.log(`skip: ${dest} does not exist`);
    continue;
  }
  try {
    lstatSync(link);
    rmSync(link, { recursive: true, force: true });
  } catch {}
  symlinkSync(dest, link, "dir");
  console.log(`${link} -> ${dest}`);
}
