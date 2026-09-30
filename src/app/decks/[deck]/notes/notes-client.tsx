"use client";

import dynamic from "next/dynamic";
import { decks } from "@/decks";

const Notes = dynamic(() => import("@/stevenote/notes").then((m) => m.Notes), { ssr: false });

export function NotesClient({ id }: { id: string }) {
  const deck = decks[id];
  if (!deck) return <main style={{ padding: "2rem" }}>No deck called “{id}”.</main>;
  return <Notes deck={deck} />;
}
