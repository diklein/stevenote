"use client";

import { Fragment, useEffect, useState } from "react";
import { BINDINGS, type Binding, type SheetGroup } from "./keyboard";

/**
 * The keyboard shortcuts sheet (the question mark). Built from the same table that handles the keys.
 * Three tabs, one per context: presenting, reviewing, and the slide grid. Tab or the arrow keys switch.
 */
const TABS: { id: Exclude<SheetGroup, "always">; label: string }[] = [
  { id: "present", label: "Presenting" },
  { id: "review", label: "Reviewing" },
  { id: "grid", label: "Slide grid" },
];
const TAB_KEY = "stevenote:shortcuts-tab";

function Keys({ b }: { b: Binding }) {
  return (
    <span className="sn-keys">
      {b.show.map((chord, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="sn-keys-join">{b.then ? "then" : "or"}</span>}
          <span className="sn-chord">
            {chord.map((c) => (
              <kbd key={c}>{c}</kbd>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

function Rows({ items }: { items: Binding[] }) {
  return (
    <dl>
      {items.map((b) => (
        <div key={b.label}>
          <dt>{b.label}</dt>
          <dd>
            <Keys b={b} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Shortcuts({ initial, status }: { initial?: Exclude<SheetGroup, "always">; status?: string }) {
  const [tab, setTab] = useState<Exclude<SheetGroup, "always">>(() => {
    if (initial) return initial;
    try {
      const t = localStorage.getItem(TAB_KEY);
      if (t === "present" || t === "review") return t; // the grid tab opens only from the grid
    } catch {}
    return "present";
  });
  useEffect(() => {
    try {
      if (tab !== "grid") localStorage.setItem(TAB_KEY, tab);
    } catch {}
  }, [tab]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = TABS.findIndex((t) => t.id === tab);
      let next = -1;
      if (e.key === "Tab") next = (i + (e.shiftKey ? TABS.length - 1 : 1)) % TABS.length;
      else if (e.key === "ArrowRight") next = Math.min(TABS.length - 1, i + 1);
      else if (e.key === "ArrowLeft") next = Math.max(0, i - 1);
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setTab(TABS[next].id);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [tab]);

  return (
    <div className="sn-shortcuts" role="dialog" aria-label="Keyboard shortcuts">
      <div className="sn-shortcuts-head">
        <strong>Keyboard shortcuts</strong>
        <div className="sn-shortcuts-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <span className="muted">Tab switches. ? or Esc closes.</span>
      </div>
      <div className="sn-shortcuts-body">
        <Rows items={BINDINGS.filter((b) => b.group === tab)} />
        <div className="sn-shortcuts-always">
          <h3>Anywhere</h3>
          <Rows items={BINDINGS.filter((b) => b.group === "always")} />
        </div>
      </div>
      {status && <div className="sn-shortcuts-foot muted">{status}</div>}
    </div>
  );
}
