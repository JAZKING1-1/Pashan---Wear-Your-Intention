import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Check, ChevronUp, Circle, CircleHelp, Sparkles } from "lucide-react";
import {
  customPresets,
  customStoneOptions,
  type Collection,
  type CustomStoneKey,
} from "@/data/products";
import { WristSizeGuide } from "@/components/WristSizeGuide";
import { BotanicalSeal } from "@/components/CraftOrnaments";
import { useAtelierCopy } from "@/data/atelier-copy";
import { stonePalette } from "@/data/bracelet-assets";
import { braceletSvg } from "@/lib/bracelet-scene/illustration";
import { StoneBraceletPreview } from "@/components/StoneBraceletPreview";
import {
  primeStonePreviews,
  type StonePreview,
} from "@/lib/bracelet-scene/stonePreview";
import {
  createDesign,
  createBead,
  designSchema,
  DESIGN_STORAGE_KEY,
  parseStoredDesign,
  publicDesignSummary,
  PREVIEW_CAPACITY,
  SAMPLE_BEADS,
  commitDesign,
  undoDesign,
  redoDesign,
  mirrorBeads,
  type BraceletBead,
  type BraceletDesign,
  type DesignHistory,
} from "@/lib/bracelet-design";
import { downloadBlob, exportDesignCard } from "@/lib/bracelet-export";
import "@/styles-atelier.css";
const Scene = lazy(() =>
  import("./BraceletScene3D").then((m) => ({ default: m.BraceletScene3D })),
);
export function BraceletComposer({ product }: { product: Collection }) {
  const { a, locale } = useAtelierCopy();
  const [state, setState] = useState<DesignHistory>(() => ({
    present: { design: createDesign(), selectedId: null },
    past: [],
    future: [],
  }));
  const [step, setStep] = useState(0);
  const [showSample, setShowSample] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);
  const [mirror, setMirror] = useState<BraceletBead[] | null>(null);
  const [mirrorOpen, setMirrorOpen] = useState(false);
  const [symmetry, setSymmetry] = useState<"off" | "mirror" | "balanced">(
    "off",
  );
  const [focus, setFocus] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [stoneDetails, setStoneDetails] = useState(false);
  const [previewStones, setPreviewStones] = useState<string | null>(null);
  // The stone cards and the combination thumbnails paint themselves from the
  // same procedural maps as the 3D beads, once the browser is idle.
  const [previews, setPreviews] = useState<
    Partial<Record<CustomStoneKey, StonePreview>>
  >({});
  useEffect(
    () =>
      primeStonePreviews(
        customStoneOptions.map((stone) => stone.key),
        setPreviews,
      ),
    [],
  );
  const [exporting, setExporting] = useState(false);
  const [card, setCard] = useState<Blob | null>(null);
  const [cardUrl, setCardUrl] = useState("");
  const [copyFallback, setCopyFallback] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [stoneFeedback, setStoneFeedback] = useState<{
    key: "stoneAdded" | "stoneReplaced";
    stone: string;
    count: number;
    position: number;
    tick: number;
  } | null>(null);
  const feedbackTick = useRef(0);
  const restored = useRef(false);
  const design = state.present.design;
  const beadImages = Object.fromEntries(
    Object.entries(previews).map(([key, value]) => [key, value!.bead]),
  );
  const selectedId = state.present.selectedId;
  const selected = design.beads.find((b) => b.id === selectedId);
  const selectedIndex = design.beads.findIndex((b) => b.id === selectedId);
  const sample = showSample && design.beads.length === 0;
  // Compare canonical schema output: equivalent fit objects can arrive with
  // different property insertion orders after editing, saving or undoing.
  const canonicalSnapshot = designSchema.safeParse(design);
  const savedHere =
    canonicalSnapshot.success &&
    lastSaved === JSON.stringify(canonicalSnapshot.data);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(DESIGN_STORAGE_KEY);
      if (raw) {
        const draft = parseStoredDesign(raw);
        if (draft) {
          setState({
            present: { design: draft, selectedId: null },
            past: [],
            future: [],
          });
          setShowSample(false);
          setLastSaved(JSON.stringify(draft));
          setMessage("restored");
        } else setInvalid(raw);
      }
    } catch {
      setMessage("saveError");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    setNameDraft(design.name ?? "");
  }, [design.name]);
  useEffect(() => {
    if (!card) {
      setCardUrl("");
      return;
    }
    const url = URL.createObjectURL(card);
    setCardUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [card]);
  const commit = (raw: BraceletDesign, id: string | null = selectedId) => {
    // Balanced symmetry keeps an even, mirrored composition as you edit. It is
    // a display convenience only: nothing about sizing or making is implied.
    let next = raw;
    if (symmetry === "balanced" && raw.beads.length % 2 === 1) {
      const mirrored = mirrorBeads(raw.beads);
      if (mirrored) next = { ...raw, beads: mirrored };
    }
    setState((s) => commitDesign(s, next, id));
    setShowSample(false);
    setMessage("");
    setCard(null);
    setMirrorOpen(false);
    setStoneFeedback(null);
  };
  const choose = (key: CustomStoneKey) => {
    const stone = customStoneOptions.find((item) => item.key === key)!.label;
    if (selected) {
      commit({
        ...design,
        beads: design.beads.map((b) =>
          b.id === selectedId ? { ...b, stoneKey: key } : b,
        ),
      });
      setStoneFeedback({
        key: "stoneReplaced",
        stone,
        count: design.beads.length,
        position: selectedIndex + 1,
        tick: ++feedbackTick.current,
      });
      return;
    }
    if (design.beads.length < PREVIEW_CAPACITY) {
      commit({ ...design, beads: [...design.beads, createBead(key)] });
      setStoneFeedback({
        key: "stoneAdded",
        stone,
        count: design.beads.length + 1,
        position: design.beads.length + 1,
        tick: ++feedbackTick.current,
      });
    }
  };
  const select = (id: string) => {
    if (sample) return;
    setStoneFeedback(null);
    setState((s) => ({ ...s, present: { ...s.present, selectedId: id } }));
  };
  const move = (offset: number) => {
    const to = selectedIndex + offset;
    if (selectedIndex < 0 || to < 0 || to >= design.beads.length) return;
    const beads = [...design.beads];
    [beads[selectedIndex], beads[to]] = [beads[to], beads[selectedIndex]];
    commit({ ...design, beads });
  };
  const history = (direction: "undo" | "redo") => {
    setState(direction === "undo" ? undoDesign : redoDesign);
    setCard(null);
    setMessage("");
    setShowSample(false);
    setStoneFeedback(null);
  };
  const save = () => {
    try {
      const canonical = designSchema.parse(design);
      localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(canonical));
      const readback = parseStoredDesign(
        localStorage.getItem(DESIGN_STORAGE_KEY),
      );
      if (!readback || JSON.stringify(readback) !== JSON.stringify(canonical))
        throw new Error("Readback failed");
      setLastSaved(JSON.stringify(readback));
      setMessage("saved");
    } catch {
      setMessage("saveError");
    }
  };
  const reset = () => {
    try {
      if (invalid)
        localStorage.setItem(DESIGN_STORAGE_KEY + "-recovery", invalid);
      localStorage.removeItem(DESIGN_STORAGE_KEY);
      setLastSaved(null);
      setInvalid(null);
      commit(createDesign());
    } catch {
      setMessage("saveError");
    }
  };
  const exportCard = async () => {
    setExporting(true);
    try {
      setCard(await exportDesignCard(design, locale));
      setMessage("exportReady");
    } catch {
      setMessage("exportError");
    } finally {
      setExporting(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicDesignSummary(design));
      setMessage("copied");
    } catch {
      setCopyFallback(true);
      setMessage("copyError");
    }
  };
  const share = async () => {
    if (!card) return;
    const file = new File([card], "pashan-design.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file], title: a("title") });
      else downloadBlob(card, "pashan-design.png");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setMessage("exportError");
    }
  };
  const status = sample
    ? a("sampleHelp")
    : selected
      ? a("selected", {
          position: selectedIndex + 1,
          stone: customStoneOptions.find((s) => s.key === selected.stoneKey)!
            .label,
        })
      : design.beads.length === PREVIEW_CAPACITY
        ? a("ready")
        : design.beads.length
          ? a("count", { count: design.beads.length })
          : a("empty");
  return (
    <section
      className="atelier"
      aria-labelledby="atelier-title"
      data-testid="atelier"
      data-loaded={loaded}
      data-bead-count={design.beads.length}
      data-saved={savedHere}
      data-focus={focus ? "true" : undefined}
    >
      <header className="atelier-heading">
        <div>
          <p>{a("subtitle")}</p>
          <h1 id="atelier-title">{a("title")}</h1>
          <p className="atelier-intro">{a("sensoryIntro")}</p>
        </div>
        <BotanicalSeal className="atelier-seal" />
      </header>
      <nav className="atelier-steps" aria-label={a("review")}>
        {(["choose", "fit", "review"] as const).map((key, i) => (
          <button
            key={key}
            type="button"
            aria-current={step === i ? "step" : undefined}
            onClick={() => setStep(i)}
          >
            <span>{i + 1}</span>
            {a(key)}
          </button>
        ))}
      </nav>
      {invalid !== null && (
        <div className="atelier-recovery" role="alert">
          <p>{a("invalid")}</p>
          <button
            onClick={() =>
              downloadBlob(
                new Blob([invalid], { type: "application/json" }),
                "pashan-recovery.json",
              )
            }
          >
            {a("recovery")}
          </button>
          <button onClick={reset}>{a("reset")}</button>
        </div>
      )}
      <div className="atelier-workbench">
        <div className="atelier-preview">
          <div className="atelier-preview-label">
            <span className="atelier-preview-name">
              <Sparkles aria-hidden="true" size={16} />
              {sample
                ? a("sample")
                : a("count", { count: design.beads.length })}
            </span>
            {!sample && design.beads.length > 0 && (
              <span
                className={
                  "atelier-draft-state" + (savedHere ? " is-saved" : "")
                }
                data-testid="draft-status"
              >
                {savedHere ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Circle size={10} aria-hidden="true" />
                )}
                {a(savedHere ? "savedHere" : "unsaved")}
              </span>
            )}
          </div>
          {/* The inspector floats over the viewer, anchored to the bead it
              describes, and returns to the flow on small screens. */}
          <div className="atelier-viewport">
            <Suspense
              fallback={
                <div
                  className="atelier-stage"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{
                    __html: braceletSvg(
                      sample ? SAMPLE_BEADS : design.beads,
                      selectedId,
                    ),
                  }}
                />
              }
            >
              <Scene
                beads={sample ? SAMPLE_BEADS : design.beads}
                selectedId={selectedId}
                onSelect={select}
                focus={focus}
                onFocusChange={setFocus}
              />
            </Suspense>
          {selected &&
            (() => {
              const stone = customStoneOptions.find(
                (s) => s.key === selected.stoneKey,
              )!;
              return (
                <aside
                  className="atelier-inspector"
                  role="group"
                  aria-label={a("selectedBeadAt", {
                    position: selectedIndex + 1,
                  })}
                >
                  <span
                    className="atelier-inspector-stone"
                    aria-hidden="true"
                    style={{
                      background: `radial-gradient(circle at 30% 25%,${
                        stonePalette[stone.key].light
                      },${stonePalette[stone.key].base} 42%,${
                        stonePalette[stone.key].dark
                      })`,
                    }}
                  />
                  <div className="atelier-inspector-body">
                    <strong>{stone.label}</strong>
                    <span>
                      {a("selectedBeadAt", {
                        position: selectedIndex + 1,
                      })}
                    </span>
                    {/* The inspector always carries one factual line about the
                      stone itself, as the reference does. */}
                  <p>{stone.description}</p>
                  </div>
                  <div className="atelier-inspector-actions">
                    <button onClick={() => setStep(0)}>{a("replace")}</button>
                    <button
                      onClick={() =>
                        commit(
                          {
                            ...design,
                            beads: design.beads.filter(
                              (b) => b.id !== selectedId,
                            ),
                          },
                          null,
                        )
                      }
                    >
                      {a("remove")}
                    </button>
                    <button
                      disabled={selectedIndex === 0}
                      onClick={() => move(-1)}
                    >
                      {a("earlier")}
                    </button>
                    <button
                      disabled={selectedIndex === design.beads.length - 1}
                      onClick={() => move(1)}
                    >
                      {a("later")}
                    </button>
                    <button
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          present: { ...s.present, selectedId: null },
                        }))
                      }
                    >
                      {a("done")}
                    </button>
                  </div>
                </aside>
              );
            })()}
          </div>
          <p className="atelier-status" role="status">
            {stoneFeedback
              ? a(stoneFeedback.key, {
                  stone: stoneFeedback.stone,
                  count: stoneFeedback.count,
                  position: stoneFeedback.position,
                })
              : status}
          </p>
          {sample && (
            <div className="atelier-sample-actions">
              <button
                className="atelier-primary"
                disabled={!loaded}
                onClick={() =>
                  commit({
                    ...design,
                    beads: SAMPLE_BEADS.map((b) => createBead(b.stoneKey)),
                  })
                }
              >
                {a("useSample")}
              </button>
              <button disabled={!loaded} onClick={() => setShowSample(false)}>
                {a("scratch")}
              </button>
            </div>
          )}
          <div className="atelier-edit-actions">
            <button
              disabled={!state.past.length}
              onClick={() => history("undo")}
            >
              ↶ {a("undo")}
            </button>
            <button
              disabled={!state.future.length}
              onClick={() => history("redo")}
            >
              ↷ {a("redo")}
            </button>
            <button
              disabled={!design.beads.length}
              onClick={() => commit({ ...design, beads: [] }, null)}
            >
              {a("clear")}
            </button>
          </div>
          {design.beads.length > 0 && (
            <details className="atelier-sequence">
              <summary>
                {a("sequence")} · {design.beads.length}
              </summary>
              <ol>
                {design.beads.map((b, i) => (
                  <li key={b.id}>
                    <button
                      data-bead-id={b.id}
                      data-stone={b.stoneKey}
                      data-seed={b.seed}
                      aria-pressed={b.id === selectedId}
                      onClick={() => {
                        select(b.id);
                        setStep(0);
                      }}
                    >
                      <span>{i + 1}.</span>{" "}
                      {
                        customStoneOptions.find((s) => s.key === b.stoneKey)
                          ?.label
                      }
                      {b.id === selectedId ? " ✓" : ""}
                    </button>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
        <div className="atelier-panel" data-step={step}>
          <div className="atelier-composition-progress">
            <div>
              <span className="atelier-composition-label">
                {a("yourComposition")}
              </span>
              <span className="atelier-composition-count">
                {String(design.beads.length).padStart(2, "0")}{" "}
                <span aria-hidden="true">/ {PREVIEW_CAPACITY}</span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={a("compositionProgress", {
                count: design.beads.length,
                capacity: PREVIEW_CAPACITY,
              })}
              aria-valuenow={design.beads.length}
              aria-valuemin={0}
              aria-valuemax={PREVIEW_CAPACITY}
              aria-describedby="atelier-progress-help"
            >
              <span
                style={{
                  transform: `scaleX(${design.beads.length / PREVIEW_CAPACITY})`,
                }}
              />
            </div>
            <p id="atelier-progress-help">{a("progressHelp")}</p>
          </div>
          {step === 0 && (
            <section
              className="atelier-step-panel"
              aria-labelledby="atelier-palette-title"
            >
              <div className="atelier-palette-head">
                <h2 id="atelier-palette-title">{a("choose")}</h2>
                <button
                  type="button"
                  className="atelier-details-toggle"
                  aria-expanded={stoneDetails}
                  onClick={() => setStoneDetails((v) => !v)}
                >
                  {a("viewDetails")}
                  <ChevronUp
                    size={14}
                    aria-hidden="true"
                    className={stoneDetails ? "is-open" : undefined}
                  />
                </button>
              </div>
              <p className="atelier-palette-hint">{a("addHint")}</p>
              {stoneDetails && (
                <ul className="atelier-stone-details">
                  {customStoneOptions.map((stone) => (
                    <li key={stone.key}>
                      <strong>{stone.label}</strong>
                      <span>{stone.description}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="atelier-palette">
                {customStoneOptions.map((stone) => (
                  <button
                    key={stone.key}
                    disabled={
                      !loaded ||
                      (!selected && design.beads.length >= PREVIEW_CAPACITY)
                    }
                    aria-label={a(selected ? "replaceWith" : "add", {
                      stone: stone.label,
                    })}
                    aria-pressed={!!selected && selected.stoneKey === stone.key}
                    onClick={() => choose(stone.key)}
                    className={
                      (selected && selected.stoneKey === stone.key
                        ? "is-current "
                        : "") +
                      (stoneFeedback?.stone === stone.label
                        ? "is-just-chosen"
                        : "")
                    }
                  >
                    <span
                      key={
                        stoneFeedback?.stone === stone.label
                          ? stoneFeedback.tick
                          : stone.key
                      }
                      className="atelier-stone"
                      style={
                        previews[stone.key]
                          ? {
                              backgroundImage: `url(${previews[stone.key]!.bead})`,
                            }
                          : {
                              background: `radial-gradient(circle at 30% 25%,${stonePalette[stone.key].light},${stonePalette[stone.key].base} 40%,${stonePalette[stone.key].dark})`,
                            }
                      }
                      aria-hidden="true"
                    />
                    <span>{stone.label}</span>
                    <small aria-hidden="true">
                      {design.beads.filter((b) => b.stoneKey === stone.key)
                        .length || "+"}
                    </small>
                  </button>
                ))}
              </div>
              <section className="atelier-presets" aria-label={a("presets")}>
                <h3>{a("presets")}</h3>
                <div className="atelier-preset-grid">
                  {customPresets.map((p) => {
                    const preview = p.sequence.map((stoneKey) => ({
                      id: stoneKey,
                      stoneKey,
                      seed: 0,
                    }));
                    return (
                      <article
                        key={p.key}
                        className={
                          "atelier-preset" +
                          (previewStones === p.key ? " is-previewing" : "")
                        }
                      >
                        <button
                          type="button"
                          className="atelier-preset-preview"
                          aria-label={a("preview")}
                          aria-pressed={previewStones === p.key}
                          onClick={() =>
                            setPreviewStones(
                              previewStones === p.key ? null : p.key,
                            )
                          }
                        >
                          <StoneBraceletPreview
                            beads={preview}
                            materials={beadImages}
                          />
                        </button>
                        <strong>{p.label}</strong>
                        <span>{p.stones}</span>
                        {previewStones === p.key && <p>{p.note}</p>}
                        <div className="atelier-preset-actions">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewStones(
                                previewStones === p.key ? null : p.key,
                              )
                            }
                          >
                            {a("preview")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              commit(
                                { ...design, beads: p.sequence.map(createBead) },
                                null,
                              )
                            }
                          >
                            {a("usePattern")}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
              <div className="atelier-symmetry" role="group" aria-label={a("symmetry")}>
                <span className="atelier-symmetry-label">
                  {a("symmetry")}
                  <CircleHelp
                    size={13}
                    aria-hidden="true"
                    aria-label={a("mirrorHelp", { count: PREVIEW_CAPACITY })}
                  />
                </span>
                <div className="atelier-symmetry-options">
                  {(["off", "mirror", "balanced"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={symmetry === mode}
                      onClick={() => {
                        setSymmetry(mode);
                        if (mode !== "mirror") setMirrorOpen(false);
                        if (mode === "mirror" && design.beads.length) {
                          setMirror(mirrorBeads(design.beads));
                          setMirrorOpen(true);
                        }
                      }}
                    >
                      {a(
                        (
                          [
                            "symmetryOff",
                            "symmetryMirror",
                            "symmetryBalanced",
                          ] as const
                        )[mode === "off" ? 0 : mode === "mirror" ? 1 : 2],
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {mirrorOpen && (
                <div className="atelier-mirror-confirm">
                  {mirror ? (
                    <>
                      <p>{a("mirrorHelp", { count: mirror.length })}</p>
                      <StoneBraceletPreview
                        beads={mirror}
                        materials={beadImages}
                      />
                      <p>
                        {mirror
                          .map(
                            (b) =>
                              customStoneOptions.find(
                                (s) => s.key === b.stoneKey,
                              )?.label,
                          )
                          .join(" → ")}
                      </p>
                      <button
                        onClick={() =>
                          commit({ ...design, beads: mirror }, null)
                        }
                      >
                        {a("apply")}
                      </button>
                    </>
                  ) : (
                    <p>{a("mirrorLimit")}</p>
                  )}
                  <button onClick={() => setMirrorOpen(false)}>
                    {a("cancel")}
                  </button>
                </div>
              )}
            </section>
          )}
          {step === 1 && (
            <div className="atelier-step-panel">
              <WristSizeGuide
                value={design.fit}
                onChange={(fit) => commit({ ...design, fit })}
              />
              <div className="atelier-step-actions">
                <button onClick={() => setStep(0)}>{a("back")}</button>
                <button className="atelier-primary" onClick={() => setStep(2)}>
                  {a("review")} →
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <section className="atelier-review atelier-step-panel">
              <h2>{a("review")}</h2>
              <p>
                {a("catalogueReference", {
                  price: new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(product.price),
                })}
              </p>
              <details>
                <summary>{a("story")}</summary>
                <p>{product.story}</p>
              </details>
              <p>{a("count", { count: design.beads.length })}</p>
              <p>
                {customStoneOptions
                  .filter((s) => design.beads.some((b) => b.stoneKey === s.key))
                  .map(
                    (s) =>
                      `${design.beads.filter((b) => b.stoneKey === s.key).length} ${s.label}`,
                  )
                  .join(" · ")}
              </p>
              <p>{a("pending")}</p>
              <p>
                {a(
                  design.fit.source === "assistance"
                    ? "assistance"
                    : design.fit.source === "known-size"
                      ? "known"
                      : "measure",
                )}{" "}
                · {a(design.fit.preference)}
              </p>
              {design.fit.wristMm !== null && (
                <p dir="ltr">
                  {new Intl.NumberFormat(locale, {
                    maximumFractionDigits: 2,
                  }).format(design.fit.wristMm / 10)}{" "}
                  cm
                </p>
              )}
              {design.fit.knownSizeReference && (
                <p>{design.fit.knownSizeReference}</p>
              )}
              <p>{a("fitHelp")}</p>
              <p>{a("variation")}</p>
              <button onClick={() => setStep(0)}>{a("choose")}</button>
              <button onClick={() => setStep(1)}>{a("fit")}</button>
            </section>
          )}
          <div className="atelier-actions">
            <button
              className="atelier-primary atelier-next"
              onClick={() => setStep(1)}
            >
              {a("fit")} →
            </button>
            <label className="atelier-name-field">
              <span>{a("nameYourDesign")}</span>
              <input
                type="text"
                maxLength={60}
                value={nameDraft}
                placeholder={a("namePlaceholder")}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={() => {
                  const next = nameDraft.trim();
                  if ((design.name ?? "") === next) return;
                  commit(
                    next
                      ? { ...design, name: next }
                      : {
                          ...design,
                          name: undefined,
                        },
                    selectedId,
                  );
                  setNameDraft(next);
                }}
              />
            </label>
            <div className="atelier-save">
              <button
                className="atelier-primary"
                disabled={
                  sample || !loaded || invalid !== null || !design.beads.length
                }
                onClick={save}
              >
                {a("save")}
              </button>
              <button
                disabled={sample || !design.beads.length || exporting}
                onClick={exportCard}
              >
                {a(exporting ? "exporting" : "export")}
              </button>
              <button disabled={!design.beads.length} onClick={copy}>
                {a("copy")}
              </button>
              <a
                href="https://wa.me/447767956428"
                target="_blank"
                rel="noreferrer"
              >
                {a("help")} ↗
              </a>
              <p>{a("privacy")}</p>
              <p role="status">
                {message ? a(message as Parameters<typeof a>[0]) : ""}
              </p>
            </div>
          </div>
          {copyFallback && (
            <textarea
              readOnly
              rows={5}
              aria-label={a("copy")}
              value={publicDesignSummary(design)}
            />
          )}
          {card && (
            <div className="atelier-export">
              <img src={cardUrl} width={1080} height={1350} alt={a("review")} />
              <button onClick={() => downloadBlob(card, "pashan-design.png")}>
                {a("download")}
              </button>
              <button onClick={share}>{a("share")}</button>
            </div>
          )}
        </div>
      </div>
      <footer className="atelier-footnote">
        <p>{a("variation")}</p>
        <p>{a("pending")}</p>
        <span>{product.stone}</span>
      </footer>
    </section>
  );
}
