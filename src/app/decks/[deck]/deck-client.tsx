"use client";

import dynamic from "next/dynamic";
import { decks } from "@/decks";

const Deck = dynamic(() => import("@/stevenote/deck").then((m) => m.Deck), { ssr: false });

export function DeckClient({ id }: { id: string }) {
  const deck = decks[id];
  if (!deck) return <main style={{ padding: "2rem" }}>No deck called “{id}”.</main>;
  return <Deck deck={deck} notesPath={`/decks/${id}/notes`} />;
}
