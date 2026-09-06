import type { CustomStoneKey } from "@/data/products";
import type { FitPreference, MeasurementSource } from "@/data/sizing-policy";

export type BraceletBead = { id: string; stoneKey: CustomStoneKey };
export type BraceletDesign = {
  schemaVersion: 1;
  designId: string;
  productSlug: "make-your-own";
  beads: BraceletBead[];
  fit: { source: MeasurementSource; wristMm: number | null; preference: FitPreference; knownSizeReference?: string; status: "unconfirmed" | "needs-help" | "confirmed" };
  intentionId?: string;
};
export const DESIGN_STORAGE_KEY = "pashan-bracelet-design-v1";
export const createDesign = (stones: CustomStoneKey[] = []): BraceletDesign => ({ schemaVersion:1, designId:`design-${Date.now().toString(36)}`, productSlug:"make-your-own", beads:stones.map((stoneKey,index)=>({id:`bead-${Date.now().toString(36)}-${index}`,stoneKey})), fit:{source:"assistance",wristMm:null,preference:"comfortable",status:"needs-help"} });
export function parseStoredDesign(raw:string|null):BraceletDesign|null { if(!raw)return null; try { const value=JSON.parse(raw) as BraceletDesign; const allowed=new Set(["amethyst","tiger-eye","green-quartz","pyrite","hematite","lava","heart-quartz","clear-quartz"]); if(value.schemaVersion!==1||value.productSlug!=="make-your-own"||!Array.isArray(value.beads)||value.beads.length>36||!value.beads.every(bead=>bead&&typeof bead.id==="string"&&allowed.has(bead.stoneKey)))return null; return value; } catch{return null;} }
export function publicDesignSummary(design:BraceletDesign){const counts=new Map<string,number>();design.beads.forEach(({stoneKey})=>counts.set(stoneKey,(counts.get(stoneKey)??0)+1));return [...counts].map(([stone,count])=>`${stone}: ${count}`).join(" · ");}
