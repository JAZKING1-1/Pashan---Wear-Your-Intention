import { useMemo, useState } from "react";
import {
  parseWristMeasurement,
  formatWristMeasurement,
  type FitPreference,
} from "@/data/sizing-policy";

export function WristSizeGuide() {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [measurement, setMeasurement] = useState("");
  const [fit, setFit] = useState<FitPreference>("comfortable");
  const [source, setSource] = useState<"measure" | "known" | "assistance">("measure");
  const parsed = useMemo(
    () => parseWristMeasurement(measurement, unit),
    [measurement, unit],
  );
  return (
    <section
      className="rounded-2xl border border-[#C96B38]/30 bg-[#F4DFCF] p-5 text-[#32170F]"
      aria-labelledby="wrist-size-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[.2em] text-[#A3471C]">
            02 · Find your fit
          </span>
          <h2 id="wrist-size-title" className="mt-1 font-serif text-3xl">
            How would you like to find your size?
          </h2>
        </div>
        <span className="rounded-full bg-[#FFF9F0] px-3 py-1 text-xs">
          Preview
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[["measure","Help me measure"],["known","I know a size that fits"],["assistance","I’m not sure / it’s a gift"]].map(([key,label])=><button type="button" key={key} onClick={()=>setSource(key as typeof source)} className={`min-h-12 rounded-xl border px-3 text-left font-semibold ${source===key?"border-[#A3471C] bg-[#FFF9F0]":"border-[#C96B38]/30"}`}>{label}</button>)}
      </div>
      {source === "measure" && <details open className="mt-4 rounded-xl bg-[#FFF9F0] p-4">
        <summary className="cursor-pointer font-semibold">No measuring tape needed</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#6F5C52]">
          <li>Wrap a strip of paper or string around your wrist.</li>
          <li>Mark where the ends meet. Keep it close without pulling tight.</li>
          <li>Lay it flat beside a ruler and enter the length.</li>
        </ol>
        <p className="mt-3 text-sm text-[#6F5C52]">
          No tape? Mark a string or paper strip at the overlap, then measure it
          flat with a physical ruler. Repeat once if uncertain.
        </p>
      </details>}
      {source === "known" && <p className="mt-4 rounded-xl bg-[#FFF9F0] p-4 text-sm">Tell our team whether this is a previous confirmed Pashan size or another bracelet measurement. Another brand’s S/M/L label still needs review.</p>}
      {source === "assistance" && <p className="mt-4 rounded-xl bg-[#FFF9F0] p-4 text-sm">Finish your design, save it, and ask us to help confirm the fit before it is made.</p>}
      {source === "measure" && <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="font-semibold">
          Length around your wrist
          <div className="mt-2 flex">
            <input
              value={measurement}
              onChange={(event) => setMeasurement(event.target.value)}
              inputMode="decimal"
              aria-describedby="wrist-help wrist-error"
              className="min-h-12 min-w-0 flex-1 rounded-l-lg border border-[#79513B] bg-[#FFF9F0] px-3"
              placeholder={unit === "cm" ? "Example: 16.5" : "Example: 6.5"}
            />
            <select
              aria-label="Measurement unit"
              value={unit}
              onChange={(event) => { const next=event.target.value as "cm"|"in"; if(parsed.mm) setMeasurement(formatWristMeasurement(parsed.mm,next)); setUnit(next); }}
              className="min-h-12 rounded-r-lg border border-l-0 border-[#79513B] bg-[#FFF9F0] px-3"
            >
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
        </label>
        <div id="wrist-help" className="self-end pb-3 text-sm text-[#6F5C52]">
          Enter the measurement as it is. We’ll account for your chosen fit.
        </div>
      </div>}
      {parsed.error && (
        <p
          id="wrist-error"
          role="alert"
          className="mt-2 text-sm font-semibold text-[#A3471C]"
        >
          {parsed.error}
        </p>
      )}
      <fieldset className="mt-5">
        <legend className="font-semibold">Fit preference</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                key: "close",
                label: "Close",
                copy: "Neater against the wrist.",
              },
              {
                key: "comfortable",
                label: "Comfortable",
                copy: "A little everyday movement.",
              },
              {
                key: "relaxed",
                label: "Relaxed",
                copy: "More room around the wrist.",
              },
            ] as const
          ).map((choice) => (
            <label
              key={choice.key}
              className={`flex min-h-14 cursor-pointer gap-3 rounded-xl border p-3 ${fit === choice.key ? "border-[#A3471C] bg-[#FFF9F0]" : "border-[#C96B38]/25"}`}
            >
              <input
                type="radio"
                name="fit"
                value={choice.key}
                checked={fit === choice.key}
                onChange={() => setFit(choice.key)}
              />
              <span>
                <strong className="block">{choice.label}</strong>
                <small className="text-[#6F5C52]">{choice.copy}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-5 border-l-2 border-[#EF7B2D] pl-3 text-sm text-[#6F5C52]">
        We’ll help confirm your fit before making your bracelet.
      </p>
    </section>
  );
}
