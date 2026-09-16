import type { Collection } from "@/data/products";

export const FINDER_SESSION_KEY = "pashan-bracelet-finder-v1";
export const FINDER_VERSION = 1;

export const finderSteps = [
  {
    key: "intention",
    name: "Intention",
    title: "What would you like to carry with you?",
    description: "Choose a personal reminder, not a promised result.",
    options: [
      {
        key: "quiet",
        label: "A quieter moment",
        detail: "Space for reflection and balance.",
      },
      {
        key: "focus",
        label: "A little more focus",
        detail: "A reminder to return to what matters.",
      },
      {
        key: "courage",
        label: "The courage to begin",
        detail: "A symbol of confidence and resolve.",
      },
      {
        key: "growth",
        label: "A new chapter",
        detail: "An intention to grow, learn and renew.",
      },
      {
        key: "purpose",
        label: "Purposeful ambition",
        detail: "Meaningful work and considered next steps.",
      },
    ],
  },
  {
    key: "palette",
    name: "Colour",
    title: "Which colours feel like you?",
    description: "Follow your eye. Natural stones vary from piece to piece.",
    options: [
      {
        key: "warm",
        label: "Earth & gold",
        detail: "Warm brown, golden bands and metallic light.",
      },
      {
        key: "dark",
        label: "Ink & charcoal",
        detail: "Quiet black and silver-dark tones.",
      },
      {
        key: "colour",
        label: "Violet & green",
        detail: "A richer note of natural colour.",
      },
      {
        key: "mixed",
        label: "A little of everything",
        detail: "Several tones, thoughtfully composed.",
      },
      {
        key: "open",
        label: "Keep an open mind",
        detail: "Colour does not need to decide.",
      },
    ],
  },
  {
    key: "wearing",
    name: "Style",
    title: "How do you want to wear it?",
    description:
      "This is a style preference. Fit is reviewed on the product page.",
    options: [
      {
        key: "understated",
        label: "An understated companion",
        detail: "A darker finish with a quieter presence.",
      },
      {
        key: "expressive",
        label: "A considered accent",
        detail: "A little lustre, colour or contrast.",
      },
      {
        key: "textural",
        label: "Something earthy & tactile",
        detail: "Drawn to a naturally matte, porous surface.",
      },
      {
        key: "open",
        label: "Let the stone lead",
        detail: "No particular finish in mind.",
      },
    ],
  },
  {
    key: "budget",
    name: "Budget",
    title: "What feels comfortable to spend?",
    description:
      "We will only show bracelets within your chosen product budget. Delivery, if applicable, is separate.",
    options: [
      {
        key: "under-800",
        label: "Up to ₹799",
        detail: "Keep it within this amount.",
      },
      {
        key: "under-1000",
        label: "Up to ₹999",
        detail: "A thoughtful place to begin.",
      },
      {
        key: "under-1500",
        label: "Up to ₹1,499",
        detail: "A little more room to explore.",
      },
      {
        key: "open",
        label: "Explore every price",
        detail: "Show the current ready-made collection.",
      },
    ],
  },
] as const;

export type FinderStepKey = (typeof finderSteps)[number]["key"];
export interface FinderAnswers {
  intention: "quiet" | "focus" | "courage" | "growth" | "purpose";
  palette: "warm" | "dark" | "colour" | "mixed" | "open";
  wearing: "understated" | "expressive" | "textural" | "open";
  budget: "under-800" | "under-1000" | "under-1500" | "open";
}
export type FinderDraft = Partial<FinderAnswers>;
export interface FinderSession {
  version: typeof FINDER_VERSION;
  answers: FinderDraft;
  step: number;
}

const intentionQualities: Record<FinderAnswers["intention"], string[]> = {
  quiet: ["Calm", "Balance", "Clarity"],
  focus: ["Focus", "Stability", "Grounding"],
  courage: ["Confidence", "Courage", "Strength", "Resilience"],
  growth: ["Growth", "Positivity", "Success"],
  purpose: ["Opportunity", "Prosperity", "Abundance"],
};

// Editorial visual metadata for current catalogue photographs and finish descriptions.
// Deliberately separate from symbolic associations and manufacturing fit.
const visualProfiles: Record<
  string,
  {
    palette: Exclude<FinderAnswers["palette"], "open">;
    wearing: Exclude<FinderAnswers["wearing"], "open">;
    colourReason: string;
    styleReason: string;
  }
> = {
  pyrite: {
    palette: "warm",
    wearing: "expressive",
    colourReason: "Its metallic golden tone follows your warm-colour choice.",
    styleReason: "Its metallic lustre makes a considered accent.",
  },
  "tiger-eye": {
    palette: "warm",
    wearing: "expressive",
    colourReason: "Its golden-brown bands follow your warm-colour choice.",
    styleReason: "Its shifting banding makes a considered accent.",
  },
  hematite: {
    palette: "dark",
    wearing: "understated",
    colourReason: "Its silver-black surface follows your darker-colour choice.",
    styleReason:
      "Its dark, single-stone palette suits your understated preference.",
  },
  amethyst: {
    palette: "colour",
    wearing: "expressive",
    colourReason: "Its violet tones follow your choice of richer colour.",
    styleReason: "Its saturated violet colour makes a considered accent.",
  },
  "green-quartz": {
    palette: "colour",
    wearing: "expressive",
    colourReason: "Its green tones follow your choice of richer colour.",
    styleReason: "Its green colour makes a considered accent.",
  },
  lava: {
    palette: "dark",
    wearing: "textural",
    colourReason: "Its charcoal tone follows your darker-colour choice.",
    styleReason:
      "Its naturally porous, matte surface suits your tactile preference.",
  },
  "dhan-yog": {
    palette: "mixed",
    wearing: "expressive",
    colourReason:
      "Its five-stone composition follows your mixed-colour choice.",
    styleReason: "Its mix of tones and stones makes a considered accent.",
  },
};

const budgets: Record<FinderAnswers["budget"], number> = {
  "under-800": 799,
  "under-1000": 999,
  "under-1500": 1499,
  open: Infinity,
};

export function parseFinderAnswers(value: unknown): FinderDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).some(
      (key) => !finderSteps.some((step) => step.key === key),
    )
  )
    return null;
  const result: Record<string, string> = {};
  for (const step of finderSteps) {
    const answer = record[step.key];
    if (answer === undefined) continue;
    if (
      typeof answer !== "string" ||
      !step.options.some((option) => option.key === answer)
    )
      return null;
    result[step.key] = answer;
  }
  return result as FinderDraft;
}

export function hasCompleteFinderAnswers(
  answers: FinderDraft,
): answers is FinderAnswers {
  return finderSteps.every((step) => answers[step.key] !== undefined);
}

export function parseFinderSession(raw: string | null): FinderSession | null {
  if (!raw || raw.length > 5000) return null;
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      value.version !== FINDER_VERSION ||
      !Number.isInteger(value.step) ||
      value.step < 0 ||
      value.step > finderSteps.length
    )
      return null;
    const answers = parseFinderAnswers(value.answers);
    if (
      !answers ||
      (value.step === finderSteps.length && !hasCompleteFinderAnswers(answers))
    )
      return null;
    if (finderSteps.slice(0, value.step).some((step) => !answers[step.key]))
      return null;
    return { version: FINDER_VERSION, answers, step: value.step };
  } catch {
    return null;
  }
}

export interface BraceletRecommendation {
  product: Collection;
  score: number;
  reasons: string[];
  matchingQualities: string[];
}
export type FinderResult =
  | { status: "invalid" | "incomplete"; matches: []; lowestPrice: null }
  | {
      status: "ready" | "no-matches";
      matches: BraceletRecommendation[];
      lowestPrice: number | null;
    };

/**
 * Explainable curation, never a reading or diagnosis.
 * Intention: 8 points per matching catalogue quality, capped at 3 (max 24).
 * Photograph palette: 5 points. Wearing/finish preference: 3 points.
 * Price: hard upper bound, never a score boost. Tie: slug, for stable ordering.
 * No identifiers, random scores, fabricated confidence percentages or analytics.
 */
export function recommendBracelets(
  input: unknown,
  catalogue: readonly Collection[],
): FinderResult {
  const answers = parseFinderAnswers(input);
  if (!answers) return { status: "invalid", matches: [], lowestPrice: null };
  if (!hasCompleteFinderAnswers(answers))
    return { status: "incomplete", matches: [], lowestPrice: null };
  const products = catalogue.filter(
    (product) =>
      !product.isCustom &&
      visualProfiles[product.slug] &&
      Number.isFinite(product.price) &&
      product.price > 0,
  );
  const lowestPrice = products.length
    ? Math.min(...products.map((product) => product.price))
    : null;
  const seen = new Set<string>();
  const matches = products
    .filter((product) => {
      if (seen.has(product.slug) || product.price > budgets[answers.budget])
        return false;
      seen.add(product.slug);
      return true;
    })
    .map((product) => {
      const profile = visualProfiles[product.slug];
      const matchingQualities = [...new Set(product.qualities)].filter(
        (quality) =>
          intentionQualities[answers.intention].some(
            (candidate) => candidate.toLowerCase() === quality.toLowerCase(),
          ),
      );
      let score = Math.min(matchingQualities.length, 3) * 8;
      const reasons: string[] = [];
      if (matchingQualities.length)
        reasons.push(
          `Its catalogue symbolism includes ${matchingQualities.join(", ").toLowerCase()} — a connection to your chosen reminder.`,
        );
      if (profile.palette === answers.palette) {
        score += 5;
        reasons.push(profile.colourReason);
      }
      if (profile.wearing === answers.wearing) {
        score += 3;
        reasons.push(profile.styleReason);
      }
      return { product, score, reasons, matchingQualities };
    })
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.product.slug.localeCompare(b.product.slug),
    );
  return {
    status: matches.length ? "ready" : "no-matches",
    matches: matches.slice(0, 3),
    lowestPrice,
  };
}

export function finderAnswerLabel(
  key: FinderStepKey,
  value: string | undefined,
): string {
  const step = finderSteps.find((candidate) => candidate.key === key);
  return (
    step?.options.find((option) => option.key === value)?.label ?? "Not chosen"
  );
}
