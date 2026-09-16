import { lazy, Suspense, useEffect, useRef, useState } from "react";
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
  const [exporting, setExporting] = useState(false);
  const [card, setCard] = useState<Blob | null>(null);
  const [cardUrl, setCardUrl] = useState("");
  const [copyFallback, setCopyFallback] = useState(false);
  const restored = useRef(false);
  const design = state.present.design;
  const selectedId = state.present.selectedId;
  const selected = design.beads.find((b) => b.id === selectedId);
  const selectedIndex = design.beads.findIndex((b) => b.id === selectedId);
  const sample = showSample && design.beads.length === 0;
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
          setMessage("restored");
        } else setInvalid(raw);
      }
    } catch {
      setMessage("saveError");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!card) {
      setCardUrl("");
      return;
    }
    const url = URL.createObjectURL(card);
    setCardUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [card]);
  const commit = (next: BraceletDesign, id: string | null = selectedId) => {
    setState((s) => commitDesign(s, next, id));
    setShowSample(false);
    setMessage("");
    setCard(null);
    setMirrorOpen(false);
  };
  const choose = (key: CustomStoneKey) => {
    if (selected) {
      commit({
        ...design,
        beads: design.beads.map((b) =>
          b.id === selectedId ? { ...b, stoneKey: key } : b,
        ),
      });
      return;
    }
    if (design.beads.length < PREVIEW_CAPACITY)
      commit({ ...design, beads: [...design.beads, createBead(key)] });
  };
  const select = (id: string) => {
    if (sample) return;
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
    >
      <header className="atelier-heading">
        <div>
          <p>{a("subtitle")}</p>
          <h1 id="atelier-title">{a("title")}</h1>
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
            <span>
              {sample
                ? a("sample")
                : a("count", { count: design.beads.length })}
            </span>
          </div>
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
            />
          </Suspense>
          <p className="atelier-status" role="status">
            {status}
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
          {selected && (
            <div
              className="atelier-selection"
              role="group"
              aria-label={a("selected", {
                position: selectedIndex + 1,
                stone: selected.stoneKey,
              })}
            >
              <strong>{a("replace")}</strong>
              <div>
                <button disabled={selectedIndex === 0} onClick={() => move(-1)}>
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
                    commit(
                      {
                        ...design,
                        beads: design.beads.filter((b) => b.id !== selectedId),
                      },
                      null,
                    )
                  }
                >
                  {a("remove")}
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
            </div>
          )}
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
        <div className="atelier-panel">
          {step === 0 && (
            <section aria-labelledby="atelier-palette-title">
              <h2 id="atelier-palette-title">{a("choose")}</h2>
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
                    onClick={() => choose(stone.key)}
                  >
                    <span
                      className="atelier-stone"
                      style={{
                        background: `radial-gradient(circle at 30% 25%,${stonePalette[stone.key].light},${stonePalette[stone.key].base} 40%,${stonePalette[stone.key].dark})`,
                      }}
                      aria-hidden="true"
                    />
                    <span>{stone.label}</span>
                    <small>
                      {design.beads.filter((b) => b.stoneKey === stone.key)
                        .length || "+"}
                    </small>
                  </button>
                ))}
              </div>
              <details className="atelier-presets">
                <summary>{a("presets")}</summary>
                {customPresets.map((p) => (
                  <button
                    key={p.key}
                    onClick={() =>
                      commit(
                        { ...design, beads: p.sequence.map(createBead) },
                        null,
                      )
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </details>
              <button
                className="atelier-mirror"
                disabled={!design.beads.length}
                onClick={() => {
                  setMirror(mirrorBeads(design.beads));
                  setMirrorOpen(true);
                }}
              >
                {a("mirror")}
              </button>
              {mirrorOpen && (
                <div className="atelier-mirror-confirm">
                  {mirror ? (
                    <>
                      <p>{a("mirrorHelp", { count: mirror.length })}</p>
                      <div
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{
                          __html: braceletSvg(mirror),
                        }}
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
              <button
                className="atelier-primary atelier-next"
                onClick={() => setStep(1)}
              >
                {a("fit")} →
              </button>
            </section>
          )}
          {step === 1 && (
            <>
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
            </>
          )}
          {step === 2 && (
            <section className="atelier-review">
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
