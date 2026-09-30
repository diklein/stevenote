// Runs after install. Makes sure src/private has the two modules the app imports, so it builds
// without a private decks repo. link-private.mjs replaces the folder with a symlink.
import { existsSync, mkdirSync, writeFileSync, lstatSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src", "private");
if (existsSync(dir) && lstatSync(dir).isSymbolicLink()) process.exit(0);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const stubs = {
  "decks.ts": `import type { DeckDef } from "@/stevenote";\n\n/** Stub. Run \`npm run link-private -- ../stevenote-decks\` to mount a private decks repo here. */\nexport const privateDecks: Record<string, DeckDef> = {};\n`,
  "api.ts": `export type PrivateHandler = (req: Request) => Promise<Response> | Response;\nexport type PrivateRoute = Partial<Record<"GET" | "POST" | "PUT" | "DELETE", PrivateHandler>>;\n\n/** Stub. A private repo exports its routes here; they are served under /api/private/<path>. */\nexport const privateRoutes: Record<string, PrivateRoute> = {};\n`,
};
for (const [name, body] of Object.entries(stubs)) {
  const file = join(dir, name);
  if (!existsSync(file)) {
    writeFileSync(file, body);
    console.log(`stevenote: wrote src/private/${name} stub`);
  }
}
