"use client";

import Link from "next/link";
import { decks } from "@/decks";

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem", fontFamily: "var(--font-geist-sans)" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Stevenote</h1>
      <p style={{ color: "oklch(70% 0 0)", marginTop: "0.5rem" }}>A presentation tool built as software.</p>
      <ul style={{ listStyle: "none", padding: 0, marginTop: "2.5rem", display: "grid", gap: "0.75rem" }}>
        {Object.values(decks).map((d) => (
          <li key={d.id}>
            <Link href={`/decks/${d.id}`} style={{ display: "block", padding: "1rem 1.25rem", border: "1px solid oklch(30% 0 0)", borderRadius: "0.75rem", color: "inherit", textDecoration: "none" }}>
              <span style={{ fontWeight: 500 }}>{d.title}</span>
              <span style={{ color: "oklch(60% 0 0)", marginLeft: "0.75rem", fontFamily: "var(--font-geist-mono)", fontSize: "0.85rem" }}>{d.slides.length} slides</span>
            </Link>
          </li>
        ))}
      </ul>
      <p style={{ color: "oklch(50% 0 0)", marginTop: "2.5rem", fontSize: "0.9rem" }}>In a deck, press ? for the keys and S for the notes window.</p>
    </main>
  );
}
