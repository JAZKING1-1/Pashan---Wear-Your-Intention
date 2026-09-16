import { useState } from "react";
import { Copy, RotateCw } from "lucide-react";
import { getDailyNote, getKolkataDateKey } from "@/data/daily-notes";
import "@/styles-ritual.css";

export function DailyNote() {
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const note = dateKey ? getDailyNote(dateKey) : "";
  const reveal = () => {
    if (revealed) return;
    // Choose at first activation, including after an idle tab crosses midnight
    // in Kolkata. Keep the chosen note stable while the person is reading.
    setDateKey(getKolkataDateKey());
    setRevealed(true);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(note + " — PASHAN");
      setCopyStatus("Copied to clipboard.");
    } catch {
      setCopyStatus("Copy is unavailable. Select the note text instead.");
    }
  };
  return (
    <section
      className="ritual-daily"
      aria-labelledby="daily-note-title"
      lang="en"
      dir="ltr"
    >
      <div className="ritual-container ritual-daily-grid">
        <div>
          <p className="ritual-kicker">A moment for you</p>
          <h2 id="daily-note-title">
            A small ritual.
            <br />
            <em>A thought to carry.</em>
          </h2>
          <p>
            No sign-up. No prediction. Just a little space to pause, and a new
            reflection each day.
          </p>
          <button
            type="button"
            className="ritual-button ritual-button-saffron"
            onClick={reveal}
            aria-controls="ritual-daily-note"
            aria-expanded={revealed}
          >
            <RotateCw size={17} aria-hidden="true" />
            {revealed ? "Today's note is open" : "Turn the beads"}
          </button>
        </div>
        <div
          className={"ritual-note-circle" + (revealed ? " is-revealed" : "")}
        >
          <svg
            viewBox="0 0 360 360"
            className="ritual-note-ring"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx="180"
              cy="180"
              r="152"
              fill="none"
              stroke="#b59662"
              strokeWidth="1"
            />
            {Array.from({ length: 24 }, (_, i) => {
              const angle = (i * Math.PI) / 12;
              return (
                <circle
                  key={i}
                  cx={180 + 152 * Math.cos(angle)}
                  cy={180 + 152 * Math.sin(angle)}
                  r={i % 3 === 0 ? 9 : 6}
                  fill={i % 3 === 0 ? "#d78a41" : "#704a35"}
                  stroke="#b59662"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
          <div
            id="ritual-daily-note"
            className="ritual-note-paper"
            aria-live="polite"
          >
            {revealed ? (
              <>
                <p className="ritual-kicker">A thought to carry today</p>
                <blockquote>{note}</blockquote>
                <button type="button" onClick={copy}>
                  <Copy size={15} aria-hidden="true" />
                  Copy text
                </button>
              </>
            ) : (
              <>
                <span aria-hidden="true">✧</span>
                <p>
                  A quiet moment,
                  <br />
                  waiting for you.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="ritual-copy-status" role="status">
        {copyStatus}
      </p>
    </section>
  );
}
