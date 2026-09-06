import { ChevronLeft, ChevronRight, Download, Plus, Redo2, RotateCcw, Save, Sparkles, Undo2 } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  customPresets,
  customStoneOptions,
  describeCustomComposition,
  type CustomStoneKey,
} from "@/data/products";
import { WristSizeGuide, type WristSizeValue } from "@/components/WristSizeGuide";
import { createDesign, DESIGN_STORAGE_KEY, parseStoredDesign, publicDesignSummary } from "@/lib/bracelet-design";

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
  const [selectedIndex,setSelectedIndex]=useState<number|null>(null);
  const [history,setHistory]=useState<CustomStoneKey[][]>([]);
  const [future,setFuture]=useState<CustomStoneKey[][]>([]);
  const [saved,setSaved]=useState("");
  const restored=useRef(false);
  const [fit,setFit]=useState<WristSizeValue>({source:"assistance",unit:"cm",measurement:"",fit:"comfortable",wristMm:null});
  const commit=(next:CustomStoneKey[])=>{setHistory(items=>[...items,beads].slice(-30));setFuture([]);onChange(next);setSelectedIndex(index=>index!==null&&index>=next.length?null:index);};
  useEffect(()=>{if(restored.current)return;restored.current=true;try{const stored=parseStoredDesign(localStorage.getItem(DESIGN_STORAGE_KEY));if(stored){onChange(stored.beads.map(bead=>bead.stoneKey));setFit({source:stored.fit.source==="paper-string"||stored.fit.source==="tape"?"measure":stored.fit.source==="known-size"?"known":"assistance",unit:"cm",measurement:stored.fit.wristMm?String(stored.fit.wristMm/10):"",fit:stored.fit.preference,wristMm:stored.fit.wristMm,knownSizeReference:stored.fit.knownSizeReference});setSaved("Restored your saved design.");}}catch{/* storage unavailable */}},[onChange]);
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
    if(selectedIndex!==null){const next=[...beads];next[selectedIndex]=key;commit(next);return;}
    if (beads.length >= MAX_BEADS) return;
    commit([...beads, key]);
  };

  const removeBead = (indexToRemove: number) => {
    commit(beads.filter((_, index) => index !== indexToRemove));
  };

  const moveSelected=(direction:-1|1)=>{if(selectedIndex===null)return;const target=selectedIndex+direction;if(target<0||target>=beads.length)return;const next=[...beads];[next[selectedIndex],next[target]]=[next[target],next[selectedIndex]];commit(next);setSelectedIndex(target);};
  const undo=()=>{const previous=history.at(-1);if(!previous)return;setFuture(items=>[beads,...items].slice(0,30));setHistory(items=>items.slice(0,-1));onChange(previous);setSelectedIndex(null);};
  const redo=()=>{const next=future[0];if(!next)return;setHistory(items=>[...items,beads].slice(-30));setFuture(items=>items.slice(1));onChange(next);setSelectedIndex(null);};
  const saveDesign=()=>{const design=createDesign(beads);design.fit={source:fit.source==="measure"?"paper-string":fit.source==="known"?"known-size":"assistance",wristMm:fit.wristMm,preference:fit.fit,knownSizeReference:fit.knownSizeReference,status:fit.source==="assistance"?"needs-help":"unconfirmed"};try{localStorage.setItem(DESIGN_STORAGE_KEY,JSON.stringify(design));setSaved("Saved on this device.");}catch{setSaved("This browser could not save the design.");}};
  const downloadSummary=()=>{const design=createDesign(beads);const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="100%" height="100%" fill="#FFF9F0"/><rect x="64" y="64" width="952" height="1222" rx="28" fill="none" stroke="#C96B38" stroke-width="4"/><text x="540" y="190" text-anchor="middle" font-family="serif" font-size="72" fill="#32170F">PASHAN</text><text x="540" y="285" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#A3471C">MY BRACELET DESIGN</text><circle cx="540" cy="655" r="250" fill="none" stroke="#EF7B2D" stroke-width="58" stroke-dasharray="45 12"/><text x="540" y="1030" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#32170F">${publicDesignSummary(design).replace(/[&<>]/g,"")}</text><text x="540" y="1160" text-anchor="middle" font-family="serif" font-size="40" fill="#79513B">Your stones. Your direction.</text></svg>`;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));a.download="pashan-bracelet-design.svg";a.click();URL.revokeObjectURL(a.href);};

  return (
    <section
      id="bracelet-composer"
      className="bracelet-composer"
      aria-labelledby="bracelet-composer-title"
    >
      <header className="composer-heading">
        <div>
          <span className="eyebrow">
            Your stones. Your direction.
          </span>
          <h1 id="bracelet-composer-title">
            Make Your Own Bracelet
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
              <i aria-hidden /> Your bracelet
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
            <BraceletScene3D beads={beads} onRemove={(index)=>setSelectedIndex(index)} />
          </Suspense>

          <div className="composer-preview-footer">
            <div className="composer-progress" aria-hidden>
              <i style={{ width: `${(beads.length / MAX_BEADS) * 100}%` }} />
            </div>
            <p>
              {beads.length === 0
                ? "The empty thread is ready. Choose any stone to start."
                : beads.length === MAX_BEADS
                  ? "Your design is ready. Let’s find your fit."
                  : `${MAX_BEADS - beads.length} visual spaces remain. Tap a bead to select it, or keep adding.`}
            </p>
            <div className="composer-edit-actions">
              <button
                type="button"
                onClick={undo}
                disabled={history.length === 0}
                title="Undo"
                aria-label="Undo last design change"
              >
                <Undo2 aria-hidden size={18} />
                <span>Undo</span>
              </button>
              <button type="button" onClick={redo} disabled={future.length===0} aria-label="Redo design change"><Redo2 aria-hidden size={18}/><span>Redo</span></button>
              <button
                type="button"
                onClick={() => commit([])}
                disabled={beads.length === 0}
                title="Clear bracelet"
                aria-label="Clear bracelet"
              >
                <RotateCcw aria-hidden size={18} />
                <span>Clear all</span>
              </button>
            </div>
          </div>
          {selectedIndex!==null&&beads[selectedIndex]&&<div className="selected-bead-toolbar" role="group" aria-label={`Edit bead ${selectedIndex+1}`}><strong>Bead {selectedIndex+1} selected</strong><button type="button" onClick={()=>moveSelected(-1)} disabled={selectedIndex===0}><ChevronLeft aria-hidden/>Move left</button><button type="button" onClick={()=>moveSelected(1)} disabled={selectedIndex===beads.length-1}>Move right<ChevronRight aria-hidden/></button><button type="button" onClick={()=>removeBead(selectedIndex)}>Remove</button></div>}
          {beads.length>1&&<button type="button" className="mirror-pattern" onClick={()=>commit([...beads,...beads.slice(0,-1).reverse()].slice(0,MAX_BEADS))}>Mirror pattern</button>}
          <ol className="accessible-bead-list" aria-label="Ordered beads">{beads.map((stone,index)=><li key={`${stone}-${index}`} className={selectedIndex===index?"is-selected":""}><button type="button" onClick={()=>setSelectedIndex(index)} aria-pressed={selectedIndex===index}>Position {index+1}: {customStoneOptions.find(item=>item.key===stone)?.label}</button></li>)}</ol>
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
                  aria-label={selectedIndex===null?`Add one ${stone.label} bead`:`Replace selected bead with ${stone.label}`}
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

          <WristSizeGuide value={fit} onChange={setFit} />

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
                  onClick={() => commit([...preset.sequence])}
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
                <h2>About your chosen stones</h2>
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
        <span>Fit pending confirmation</span>
        <p>
          Stone meanings are traditional associations, not medical claims.
          Natural colour and pattern will vary from the on-screen composition.
        </p>
      </footer>
      <div className="design-actions"><button type="button" className="btn-dark" onClick={saveDesign}><Save aria-hidden size={18}/>Save design</button><button type="button" className="btn-paper" onClick={downloadSummary} disabled={!beads.length}><Download aria-hidden size={18}/>Download design card</button><a className="btn-paper" href="https://wa.me/447767956428?text=Namaste%20Pashan%2C%20please%20help%20me%20confirm%20the%20fit%20of%20my%20saved%20bracelet%20design." target="_blank" rel="noreferrer">Ask about fit</a><p role="status">{saved}</p></div>
    </section>
  );
}
