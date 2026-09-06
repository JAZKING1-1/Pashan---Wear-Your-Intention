export const sizingPolicy = {
  version: "preview-2026-09-05",
  status: "pending-maker-confirmation" as const,
  measuredRanges: [],
  testedFitAllowances: [],
  allowedBeadSizes: [],
  allowedBeadCounts: [],
};

export type FitPreference = "close" | "comfortable" | "relaxed" | "gift";

export const parseWristMeasurement = (raw: string, unit: "cm" | "in") => {
  const cleaned = raw
    .trim()
    .toLocaleLowerCase()
    .replace(",", ".")
    .replace(/\s*(cm|in|inch|inches)\s*$/, "");
  if (!cleaned) return { mm: null, error: null };
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0)
    return { mm: null, error: "Enter a positive wrist measurement." };
  const mm = unit === "cm" ? value * 10 : value * 25.4;
  if (mm < 80 || mm > 350)
    return {
      mm: null,
      error:
        "That looks unusual for a wrist circumference. Please measure again.",
    };
  return { mm: Math.round(mm), error: null };
};
