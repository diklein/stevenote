import { NotesClient } from "./notes-client";

export default async function NotesPage({ params }: { params: Promise<{ deck: string }> }) {
  const { deck } = await params;
  return <NotesClient id={deck} />;
}
