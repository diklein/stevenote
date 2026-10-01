"use client";

/** The keyboard shortcuts sheet, opened with the question mark. One list, grouped by what you are doing. */
const GROUPS: { title: string; keys: [string[], string][] }[] = [
  {
    title: "Present",
    keys: [
      [["→", "Space"], "Next build or slide"],
      [["←", "⇧Space"], "Back"],
      [["Home", "End"], "First or last slide"],
      [["1–9", "Enter"], "Type a slide number, then Enter, to jump"],
      [["B", "."], "Black screen"],
      [["W"], "White screen"],
      [["F"], "Fullscreen"],
      [["S"], "Speaker notes window"],
      [["-"], "Hurry mode: skip marked slides"],
      [["X"], "Swap a live demo for its backup video"],
    ],
  },
  {
    title: "Review",
    keys: [
      [["O"], "All slides, with what's approved"],
      [["/"], "Feedback on this slide"],
      [["⌘Enter"], "Submit feedback (in the feedback box)"],
      [["A"], "Approve this slide"],
      [["⇧A"], "Show or hide the corner flags"],
    ],
  },
  {
    title: "View",
    keys: [
      [["G"], "Grid overlay"],
      [[","], "Preferences"],
      [["?"], "These shortcuts"],
      [["Esc"], "Close whatever is open"],
    ],
  },
];

export function Shortcuts({ status }: { status?: string }) {
  return (
    <div className="sn-shortcuts" role="dialog" aria-label="Keyboard shortcuts">
      <div className="sn-shortcuts-head">
        <strong>Keyboard shortcuts</strong>
        <span className="muted">? or Esc closes</span>
      </div>
      <div className="sn-shortcuts-cols">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h3>{g.title}</h3>
            <dl>
              {g.keys.map(([keys, what]) => (
                <div key={what}>
                  <dt>
                    {keys.map((k) => (
                      <kbd key={k}>{k}</kbd>
                    ))}
                  </dt>
                  <dd>{what}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      {status && <div className="sn-shortcuts-foot muted">{status}</div>}
    </div>
  );
}
