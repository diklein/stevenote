import type { DeckDef } from "@/stevenote";
import { example } from "./example/deck";
import { privateDecks } from "@/private/decks";

/** Every deck the app can present, by id. Private decks are mounted with `npm run link-private`. */
export const decks: Record<string, DeckDef> = {
  [example.id]: example,
  ...privateDecks,
};
