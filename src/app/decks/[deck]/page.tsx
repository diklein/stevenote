import type { Metadata } from "next";
import { decks } from "@/decks";
import { DeckClient } from "./deck-client";

/** The tab is named after the deck, so a talk reads as the talk and not as the tool. */
export async function generateMetadata({ params }: { params: Promise<{ deck: string }> }): Promise<Metadata> {
  const { deck } = await params;
  return { title: decks[deck]?.title ?? "Stevenote" };
}

export default async function DeckPage({ params }: { params: Promise<{ deck: string }> }) {
  const { deck } = await params;
  return <DeckClient id={deck} />;
}
