import { z } from "zod";
import { customStoneOptions, type CustomStoneKey } from "@/data/products";

export const PREVIEW_CAPACITY = 18;
export const ASSET_VERSION = "stone-2026-09-v4";
export const SCENE_VERSION = "atelier-v4";
export const DESIGN_STORAGE_KEY = "pashan-bracelet-design-v1";
const identity = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
const stoneSchema = z.enum(
  customStoneOptions.map((s) => s.key) as [CustomStoneKey, ...CustomStoneKey[]],
);
export const fitSchema = z.object({
  source: z.enum(["paper-string", "tape", "known-size", "assistance"]),
  wristMm: z.number().finite().positive().max(10000).nullable(),
  preference: z.enum(["close", "comfortable", "relaxed"]),
  unit: z.enum(["cm", "in"]),
  measurement: z.string().max(80),
  knownSizeReference: z.string().max(300).optional(),
  status: z.enum(["unconfirmed", "needs-help"]),
});
export const beadSchema = z.object({
  id: identity,
  stoneKey: stoneSchema,
  seed: z.number().int().min(0).max(2147483647),
});
export const designSchema = z
  .object({
    schemaVersion: z.literal(2),
    designId: identity,
    productSlug: z.literal("make-your-own"),
    assetVersion: z.literal(ASSET_VERSION),
    sceneVersion: z.literal(SCENE_VERSION),
    beads: z.array(beadSchema).max(PREVIEW_CAPACITY),
    fit: fitSchema,
  })
  .superRefine((d, ctx) => {
    if (new Set(d.beads.map((b) => b.id)).size !== d.beads.length)
      ctx.addIssue({ code: "custom", message: "Duplicate bead identity" });
    if (
      d.fit.source !== "paper-string" &&
      d.fit.source !== "tape" &&
      d.fit.wristMm !== null
    )
      ctx.addIssue({
        code: "custom",
        message: "Reference and assistance sizes are not wrist measurements",
      });
  });
export type BraceletBead = z.infer<typeof beadSchema>;
export type BraceletFit = z.infer<typeof fitSchema>;
export type BraceletDesign = z.infer<typeof designSchema>;
export const newId = () =>
  `p-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
export const seedFor = (id: string) =>
  Array.from(id).reduce(
    (h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) & 2147483647,
    17,
  );
export const createBead = (stoneKey: CustomStoneKey): BraceletBead => {
  const id = newId();
  return { id, stoneKey, seed: seedFor(id) };
};
export const createDesign = (
  stones: CustomStoneKey[] = [],
): BraceletDesign => ({
  schemaVersion: 2,
  designId: newId(),
  productSlug: "make-your-own",
  assetVersion: ASSET_VERSION,
  sceneVersion: SCENE_VERSION,
  beads: stones.map(createBead),
  fit: {
    source: "assistance",
    unit: "cm",
    measurement: "",
    wristMm: null,
    preference: "comfortable",
    status: "needs-help",
  },
});
export function parseStoredDesign(raw: string | null): BraceletDesign | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value.schemaVersion === 1) {
      const old = z
        .object({
          schemaVersion: z.literal(1),
          designId: identity,
          productSlug: z.literal("make-your-own"),
          beads: z
            .array(z.object({ id: identity, stoneKey: stoneSchema }))
            .max(PREVIEW_CAPACITY),
          fit: z.object({
            source: fitSchema.shape.source,
            wristMm: fitSchema.shape.wristMm,
            preference: fitSchema.shape.preference,
            knownSizeReference: z.string().max(300).optional(),
            status: z.enum(["unconfirmed", "needs-help", "confirmed"]),
          }),
        })
        .parse(value);
      return designSchema.parse({
        ...old,
        schemaVersion: 2,
        assetVersion: ASSET_VERSION,
        sceneVersion: SCENE_VERSION,
        beads: old.beads.map((b) => ({ ...b, seed: seedFor(b.id) })),
        fit: {
          ...old.fit,
          unit: "cm",
          measurement:
            old.fit.wristMm === null ? "" : String(old.fit.wristMm / 10),
          status:
            old.fit.source === "assistance" ? "needs-help" : "unconfirmed",
        },
      });
    }
    return designSchema.parse(value);
  } catch {
    return null;
  }
}
export type Snapshot = { design: BraceletDesign; selectedId: string | null };
export type DesignHistory = {
  present: Snapshot;
  past: Snapshot[];
  future: Snapshot[];
};
export function commitDesign(
  state: DesignHistory,
  design: BraceletDesign,
  selectedId: string | null = state.present.selectedId,
): DesignHistory {
  designSchema.parse(design);
  return {
    present: {
      design,
      selectedId: design.beads.some((b) => b.id === selectedId)
        ? selectedId
        : null,
    },
    past: [...state.past, state.present].slice(-50),
    future: [],
  };
}
export function undoDesign(s: DesignHistory): DesignHistory {
  const previous = s.past.at(-1);
  return previous
    ? {
        present: previous,
        past: s.past.slice(0, -1),
        future: [s.present, ...s.future],
      }
    : s;
}
export function redoDesign(s: DesignHistory): DesignHistory {
  const next = s.future[0];
  return next
    ? { present: next, past: [...s.past, s.present], future: s.future.slice(1) }
    : s;
}
export function mirrorBeads(beads: BraceletBead[]): BraceletBead[] | null {
  if (!beads.length || beads.length * 2 > PREVIEW_CAPACITY) return null;
  return [...beads, ...[...beads].reverse().map((b) => createBead(b.stoneKey))];
}
export function publicDesignSummary(design: BraceletDesign) {
  return `PASHAN / ${design.designId}\n${design.beads.map((b, i) => `${i + 1}. ${customStoneOptions.find((s) => s.key === b.stoneKey)?.label}`).join(" → ")}\n${design.assetVersion} / ${design.sceneVersion}`;
}
export const SAMPLE_BEADS: BraceletBead[] = Array.from(
  { length: 18 },
  (_, i) => ({
    id: `sample-${i}`,
    stoneKey: (i < 6
      ? "tiger-eye"
      : i < 12
        ? "hematite"
        : "amethyst") as CustomStoneKey,
    seed: seedFor(`sample-${i}`),
  }),
);
