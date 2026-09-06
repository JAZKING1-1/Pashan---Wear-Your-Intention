import { useState } from "react";
import { BotanicalSeal, DoubleLineFrame } from "@/components/CraftOrnaments";
import { getDailyNote, getKolkataDateKey } from "@/data/daily-notes";

export function DailyNote() {
  const [dateKey] = useState(() => getKolkataDateKey());
  const [revealed, setRevealed] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const note = getDailyNote(dateKey);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${note} — PASHAN`);
      setCopyStatus("Copied to clipboard.");
    } catch {
      setCopyStatus("Copy is unavailable. Select the note text instead.");
    }
  };
  return (
    <section
      className="bg-[#F4DFCF] py-16 sm:py-24"
      aria-labelledby="daily-note-title"
    >
      <div className="container-luxe grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">A moment for you</p>
          <h2
            id="daily-note-title"
            className="mt-3 font-serif text-5xl text-[#32170F]"
          >
            Turn the beads.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#6F5C52]">
            A small thought to carry with you today.
          </p>
        </div>
        <div className="relative min-h-80 overflow-hidden rounded-[20px] bg-[#EF7B2D] p-7 text-[#32170F]">
          <DoubleLineFrame className="pointer-events-none absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] opacity-40" />
          <div className="relative flex min-h-64 flex-col items-center justify-center text-center">
            {!revealed ? (
              <>
                <BotanicalSeal className="daily-note-beads size-28" />
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="mt-6 min-h-11 rounded-full bg-[#32170F] px-6 font-semibold text-[#FFF9F0]"
                >
                  Turn the beads
                </button>
                <p role="status" className="mt-3 text-sm">{copyStatus}</p>
              </>
            ) : (
              <div aria-live="polite">
                <p className="text-xs font-semibold uppercase tracking-[.2em]">
                  A thought to carry today
                </p>
                <blockquote className="mx-auto mt-5 max-w-md font-serif text-4xl leading-tight">
                  “{note}”
                </blockquote>
                <button
                  type="button"
                  onClick={copy}
                  className="mt-6 min-h-11 rounded-full border border-[#32170F] px-5 text-sm font-semibold"
                >
                  Copy text
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
