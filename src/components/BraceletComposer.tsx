import { Plus, RotateCcw, Sparkles, Undo2 } from "lucide-react";
import { lazy, Suspense } from "react";
import {
  customPresets,
  customStoneOptions,
  describeCustomComposition,
  type CustomStoneKey,
} from "@/data/products";

const MAX_BEADS = 18;

const BraceletScene3D = lazy(() =>
  import("@/components/BraceletScene3D").then((module) => ({
    default: module.BraceletScene3D,
  })),
);

export function BraceletComposer({
  beads,
  onChange,
}: {
  beads: CustomStoneKey[];
  onChange: (beads: CustomStoneKey[]) => void;
}) {
  const counts = new Map<CustomStoneKey, number>();
  beads.forEach((bead) => counts.set(bead, (counts.get(bead) ?? 0) + 1));

  const activeStones = customStoneOptions.filter((stone) =>
    counts.has(stone.key),
  );
  const combinedQualities = [
    ...new Set(activeStones.flatMap((stone) => stone.qualities)),
  ];
  const activePreset = customPresets.find(
    (preset) => preset.sequence.join("|") === beads.join("|"),
  );

  const addBead = (key: CustomStoneKey) => {
    if (beads.length >= MAX_BEADS) return;
    onChange([...beads, key]);
  };

  const removeBead = (indexToRemove: number) => {
    onChange(beads.filter((_, index) => index !== indexToRemove));
  };

  return (
    <section
      id="bracelet-composer"
      className="bracelet-composer"
      aria-labelledby="bracelet-composer-title"
    >
      <header className="composer-heading">
        <div>
          <span className="eyebrow">
            Personal bracelet builder / Live preview
          </span>
          <h1 id="bracelet-composer-title">
            Make Your Own Bracelet
            <br />
            <em>Customisation Service</em>
          </h1>
        </div>
        <p>
          Add stones one bead at a time, or begin with one of our suggested
          combinations. Your traditional stone associations will appear as the
          bracelet takes form.
        </p>
      </header>

      <div className="composer-workbench">
        <div className="composer-preview">
          <div className="composer-preview-bar">
            <span>
              <i aria-hidden /> Live composition
            </span>
            <strong>
              {beads.length} / {MAX_BEADS} beads
            </strong>
          </div>

          <Suspense
            fallback={
              <div className="bracelet-3d-stage">
                <div className="bracelet-3d-loading" role="status">
                  Preparing your stone table
                </div>
              </div>
            }
          >
            <BraceletScene3D beads={beads} onRemove={removeBead} />
          </Suspense>

          <div className="composer-preview-footer">
            <div className="composer-progress" aria-hidden>
              <i style={{ width: `${(beads.length / MAX_BEADS) * 100}%` }} />
            </div>
            <p>
              {beads.length === 0
                ? "The empty thread is ready. Choose any stone to start."
                : beads.length === MAX_BEADS
                  ? "Your bracelet is complete and ready to reserve."
                  : `${MAX_BEADS - beads.length} spaces remain. Tap a bead to remove it, or keep adding.`}
            </p>
            <div className="composer-edit-actions">
              <button
                type="button"
                onClick={() => onChange(beads.slice(0, -1))}
                disabled={beads.length === 0}
                title="Remove last bead"
                aria-label="Remove last bead"
              >
                <Undo2 aria-hidden size={18} />
                <span>Remove last bead</span>
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                disabled={beads.length === 0}
                title="Clear bracelet"
                aria-label="Clear bracelet"
              >
                <RotateCcw aria-hidden size={18} />
                <span>Clear all</span>
              </button>
            </div>
          </div>
        </div>

        <div className="composer-control-panel">
          <section className="composer-stone-palette">
            <div className="composer-section-title">
              <div>
                <span>01</span>
                <h2>Add a stone</h2>
              </div>
              <small>Tap to add one bead</small>
            </div>
            <div className="composer-stone-grid">
              {customStoneOptions.map((stone) => (
                <button
                  key={stone.key}
                  type="button"
                  onClick={() => addBead(stone.key)}
                  disabled={beads.length >= MAX_BEADS}
                  aria-label={`Add one ${stone.label} bead`}
                >
                  <i className={`stone-swatch is-${stone.key}`} aria-hidden />
                  <span>
                    <strong>{stone.label}</strong>
                    <small>{stone.qualities.slice(0, 2).join(" / ")}</small>
                  </span>
                  <b>{counts.get(stone.key) ?? 0}</b>
                  <Plus aria-hidden size={17} />
                </button>
              ))}
            </div>
          </section>

          <section className="composer-presets">
            <div className="composer-section-title">
              <div>
                <span>02</span>
                <h2>Suggested combinations</h2>
              </div>
              <small>Start with a complete composition</small>
            </div>
            <div className="composer-preset-grid">
              {customPresets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => onChange([...preset.sequence])}
                  className={
                    activePreset?.key === preset.key ? "is-active" : ""
                  }
                  aria-pressed={activePreset?.key === preset.key}
                >
                  <span>
                    <strong>{preset.label}</strong>
                    <small>{preset.stones}</small>
                  </span>
                  <Sparkles aria-hidden size={17} />
                </button>
              ))}
            </div>
          </section>

          <section className="composer-reading" aria-live="polite">
            <div className="composer-section-title">
              <div>
                <span>03</span>
                <h2>Your stone reading</h2>
              </div>
              <small>Traditional associations</small>
            </div>
            {activeStones.length ? (
              <>
                <p>{describeCustomComposition(beads)}</p>
                <div className="composer-quality-cloud">
                  {combinedQualities.map((quality, index) => (
                    <span
                      key={quality}
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      {quality}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="composer-reading-empty">
                Add your first bead to reveal the qualities in your custom
                combination.
              </p>
            )}
          </section>
        </div>
      </div>

      <footer className="composer-footnote">
        <span>Free size</span>
        <p>
          Stone meanings are traditional associations, not medical claims.
          Natural colour and pattern will vary from the on-screen composition.
        </p>
      </footer>
    </section>
  );
}
