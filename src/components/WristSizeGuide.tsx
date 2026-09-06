import { useMemo } from "react";
import { formatWristMeasurement, parseWristMeasurement, type FitPreference } from "@/data/sizing-policy";

export type WristSizeValue={source:"measure"|"known"|"assistance";unit:"cm"|"in";measurement:string;fit:FitPreference;wristMm:number|null;knownSizeReference?:string};

export function WristSizeGuide({value,onChange}:{value:WristSizeValue;onChange:(next:WristSizeValue)=>void}){
 const {source,unit,measurement,fit}=value;
 const parsed=useMemo(()=>parseWristMeasurement(measurement,unit),[measurement,unit]);
 const update=(patch:Partial<WristSizeValue>)=>onChange({...value,...patch});
 return <section className="wrist-size-guide" aria-labelledby="wrist-size-title">
  <p className="eyebrow">02 · Find your fit</p><h2 id="wrist-size-title">How would you like to find your size?</h2>
  <div className="fit-source-grid">{[["measure","Help me measure"],["known","I know a size that fits"],["assistance","I’m not sure / it’s a gift"]].map(([key,label])=><button type="button" key={key} aria-pressed={source===key} onClick={()=>update({source:key as WristSizeValue["source"],wristMm:key==="measure"?parsed.mm:null})}>{label}</button>)}</div>
  {source==="measure"&&<div className="measure-panel"><ol><li>Wrap a strip of paper or string around your wrist.</li><li>Mark where the ends meet. Keep it close without pulling tight.</li><li>Lay it flat beside a physical ruler and enter the length.</li></ol><label>Length around your wrist<div className="measurement-row"><input value={measurement} onChange={event=>{const next=event.target.value;const result=parseWristMeasurement(next,unit);update({measurement:next,wristMm:result.mm})}} inputMode="decimal" aria-describedby="wrist-help wrist-error" placeholder={unit==="cm"?"Example: 16.5":"Example: 6.5"}/><select aria-label="Measurement unit" value={unit} onChange={event=>{const next=event.target.value as "cm"|"in";update({unit:next,measurement:parsed.mm?formatWristMeasurement(parsed.mm,next):measurement,wristMm:parsed.mm})}}><option value="cm">cm</option><option value="in">in</option></select></div></label><p id="wrist-help">Enter the measurement as it is. We’ll account for your chosen fit. Repeat once if uncertain.</p>{parsed.error&&<p id="wrist-error" role="alert" className="fit-error">{parsed.error}</p>}</div>}
  {source==="known"&&<label className="known-size-panel">What fits you now?<input value={value.knownSizeReference??""} onChange={event=>update({knownSizeReference:event.target.value,wristMm:null})} placeholder="Previous Pashan size or bracelet details"/><small>Another brand’s S/M/L label still needs maker review.</small></label>}
  {source==="assistance"&&<p className="assistance-panel">Finish and save your design. We’ll help confirm the fit before making your bracelet.</p>}
  <fieldset><legend>How do you like it to sit?</legend><div className="fit-choice-grid">{([{key:"close",label:"Close",copy:"Sits close to your wrist."},{key:"comfortable",label:"Comfortable",copy:"A little room for everyday movement."},{key:"relaxed",label:"Relaxed",copy:"A looser feel."}] as const).map(choice=><label key={choice.key} className={fit===choice.key?"is-selected":""}><input type="radio" name="fit" checked={fit===choice.key} onChange={()=>update({fit:choice.key})}/><span><strong>{choice.label}</strong><small>{choice.copy}</small></span></label>)}</div></fieldset>
 </section>;
}
