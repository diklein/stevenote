import type { DeckDef } from "@/stevenote";
import { example } from "./example/deck";

/** Every deck the app can present, by id. Private decks are added here from outside the repo. */
export const decks: Record<string, DeckDef> = {
  [example.id]: example,
};
