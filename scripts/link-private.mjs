// Mounts a private decks repo: src/private -> <repo>/src, which must export decks.ts and api.ts.
// The path is gitignored, so the public repo never carries deck content.
import { existsSync, lstatSync, rmSync, symlinkSync } from "node:fs";
import { resolve, join } from "node:path";

const target = process.argv[2];
if (!target) {
  console.error("usage: npm run link-private -- <path to private repo>");
  process.exit(1);
}
const dest = join(resolve(target), "src");
if (!existsSync(dest)) {
  console.error(`${dest} does not exist`);
  process.exit(1);
}
const link = join(process.cwd(), "src", "private");
try {
  lstatSync(link);
  rmSync(link, { recursive: true, force: true });
} catch {}
symlinkSync(dest, link, "dir");
console.log(`${link} -> ${dest}`);
