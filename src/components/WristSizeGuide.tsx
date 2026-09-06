import { useMemo, useState } from "react";
import {
  parseWristMeasurement,
  sizingPolicy,
  type FitPreference,
} from "@/data/sizing-policy";

export function WristSizeGuide() {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [measurement, setMeasurement] = useState("");
  const [fit, setFit] = useState<FitPreference>("comfortable");
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
            Measure your wrist
          </h2>
        </div>
        <span className="rounded-full bg-[#FFF9F0] px-3 py-1 text-xs">
          Preview
        </span>
      </div>
      <details className="mt-4 rounded-xl bg-[#FFF9F0] p-4">
        <summary className="cursor-pointer font-semibold">
          Help me measure
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#6F5C52]">
          <li>
            Wrap a flexible tape at the position where you will wear the
            bracelet.
          </li>
          <li>Keep it snug without compressing the skin.</li>
          <li>Enter the circumference exactly; do not add extra allowance.</li>
        </ol>
        <p className="mt-3 text-sm text-[#6F5C52]">
          No tape? Mark a string or paper strip at the overlap, then measure it
          flat with a physical ruler. Repeat once if uncertain.
        </p>
      </details>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="font-semibold">
          Wrist circumference
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
              onChange={(event) => setUnit(event.target.value as "cm" | "in")}
              className="min-h-12 rounded-r-lg border border-l-0 border-[#79513B] bg-[#FFF9F0] px-3"
            >
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
        </label>
        <div id="wrist-help" className="self-end pb-3 text-sm text-[#6F5C52]">
          {parsed.mm
            ? `Stored as ${parsed.mm} mm`
            : "Your physical measurement"}
        </div>
      </div>
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
              {
                key: "gift",
                label: "I don't know / gift",
                copy: "Pashan will need to confirm fit.",
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
        Sizing policy {sizingPolicy.version} is awaiting maker confirmation. You
        can compose and review locally, but custom purchase remains disabled.
      </p>
    </section>
  );
}
