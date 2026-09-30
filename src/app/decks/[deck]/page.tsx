import { DeckClient } from "./deck-client";

export default async function DeckPage({ params }: { params: Promise<{ deck: string }> }) {
  const { deck } = await params;
  return <DeckClient id={deck} />;
}
