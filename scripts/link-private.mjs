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
// Files in the private repo resolve packages from their real path, so give it this app's node_modules.
const nm = join(repo, "node_modules");
try { lstatSync(nm); } catch { symlinkSync(join(process.cwd(), "node_modules"), nm, "dir"); console.log(`${nm} -> node_modules`); }
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
