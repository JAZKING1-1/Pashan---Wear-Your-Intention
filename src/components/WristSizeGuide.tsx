import type { BraceletFit } from "@/lib/bracelet-design";
import {
  formatWristMeasurement,
  parseWristMeasurement,
} from "@/data/sizing-policy";
import { useAtelierCopy } from "@/data/atelier-copy";
export function WristSizeGuide({
  value,
  onChange,
}: {
  value: BraceletFit;
  onChange: (next: BraceletFit) => void;
}) {
  const { a } = useAtelierCopy();
  const measured = value.source === "paper-string" || value.source === "tape";
  const parsed = parseWristMeasurement(value.measurement, value.unit);
  const update = (patch: Partial<BraceletFit>) =>
    onChange({ ...value, ...patch });
  return (
    <section className="atelier-fit" aria-labelledby="atelier-fit-heading">
      <h2 id="atelier-fit-heading">{a("fit")}</h2>
      <div className="atelier-fit-sources">
        {(["paper-string", "known-size", "assistance"] as const).map(
          (source, i) => (
            <button
              key={source}
              type="button"
              aria-pressed={
                source === "paper-string" ? measured : value.source === source
              }
              onClick={() =>
                update({
                  source,
                  wristMm: source === "paper-string" ? parsed.mm : null,
                  status:
                    source === "assistance" ? "needs-help" : "unconfirmed",
                })
              }
            >
              {a((["measure", "known", "assistance"] as const)[i])}
            </button>
          ),
        )}
      </div>
      {measured && (
        <div className="atelier-measure">
          <ol className="atelier-measure-steps">
            {(["instruction1", "instruction2", "instruction3"] as const).map(
              (key, i) => (
                <li key={key}>
                  <svg
                    viewBox="0 0 100 50"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d={
                        i === 0
                          ? "M15 30Q25 5 50 10Q80 10 85 30M15 30Q50 52 85 30M38 7L38 44M62 7L62 44"
                          : i === 1
                            ? "M12 25H88M46 10V40M52 10V40"
                            : "M10 15H90V40H10ZM20 15V28M30 15V23M40 15V28M50 15V23M60 15V28M70 15V23M80 15V28"
                      }
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>{a(key)}</span>
                </li>
              ),
            )}
          </ol>
          <label className="atelier-check">
            <input
              type="checkbox"
              checked={value.source === "tape"}
              onChange={(e) =>
                update({ source: e.target.checked ? "tape" : "paper-string" })
              }
            />
            {a("tape")}
          </label>
          <label htmlFor="atelier-wrist">{a("wrist")}</label>
          <div className="atelier-measurement-row">
            <input
              id="atelier-wrist"
              inputMode="decimal"
              value={value.measurement}
              maxLength={80}
              aria-invalid={!!parsed.error}
              aria-describedby="atelier-measure-help atelier-measure-error"
              onChange={(e) => {
                const result = parseWristMeasurement(
                  e.target.value,
                  value.unit,
                );
                update({ measurement: e.target.value, wristMm: result.mm });
              }}
            />
            <select
              aria-label={a("unit")}
              value={value.unit}
              onChange={(e) => {
                const unit = e.target.value as "cm" | "in";
                update({
                  unit,
                  measurement:
                    value.wristMm === null
                      ? value.measurement
                      : formatWristMeasurement(value.wristMm, unit),
                });
              }}
            >
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>
          <p id="atelier-measure-help">
            {a("example")}
            <br />
            {a("measureHelp")}
          </p>
          <p id="atelier-measure-error" role="status">
            {parsed.error
              ? a("invalidMeasure")
              : value.wristMm !== null &&
                  (value.wristMm < 80 || value.wristMm > 350)
                ? a("unusual")
                : ""}
          </p>
        </div>
      )}
      {value.source === "known-size" && (
        <label className="atelier-known">
          {a("knownHelp")}
          <textarea
            maxLength={300}
            rows={3}
            value={value.knownSizeReference ?? ""}
            onChange={(e) => update({ knownSizeReference: e.target.value })}
          />
        </label>
      )}
      {value.source === "assistance" && <p>{a("fitHelp")}</p>}
      <fieldset>
        <legend>{a("preference")}</legend>
        <div className="atelier-fit-options">
          {(["close", "comfortable", "relaxed"] as const).map((preference) => (
            <label key={preference}>
              <input
                type="radio"
                name="atelier-fit"
                checked={value.preference === preference}
                onChange={() => update({ preference })}
              />
              <span>{a(preference)}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
