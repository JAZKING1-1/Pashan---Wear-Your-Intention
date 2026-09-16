export const sizingPolicy = {
  version: "preview-2026-09-05",
  status: "pending-maker-confirmation" as const,
  measuredRanges: [],
  testedFitAllowances: [],
  allowedBeadSizes: [],
  allowedBeadCounts: [],
};

export type FitPreference = "close" | "comfortable" | "relaxed";
export type MeasurementSource =
  "paper-string" | "tape" | "known-size" | "assistance";

const nativeDigits: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

export const parseWristMeasurement = (
  raw: string,
  selectedUnit: "cm" | "in",
) => {
  const digitStarts = [
    0x0660, 0x06f0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0be6, 0x0c66,
  ];
  const normalized = Array.from(raw.trim().toLowerCase())
    .map((char) => {
      const code = char.codePointAt(0)!;
      const start = digitStarts.find((n) => code >= n && code < n + 10);
      return start === undefined ? char : String(code - start);
    })
    .join("")
    .replace(/[٬]/g, "")
    .replace(/[٫,]/g, ".");
  const match = normalized.match(
    /^([0-9]+(?:\.[0-9]+)?)\s*(cm|in|inch|inches)?$/,
  );
  if (!normalized) return { mm: null, error: null };
  if (!match)
    return {
      mm: null,
      error: "Enter one measurement, for example 16.5 cm or 6.5 in.",
    };
  const [, cleaned, suffix] = match;
  const unit = suffix ? (suffix === "cm" ? "cm" : "in") : selectedUnit;
  if (!cleaned) return { mm: null, error: null };
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0)
    return { mm: null, error: "Enter a positive wrist measurement." };
  const mm = unit === "cm" ? value * 10 : value * 25.4;
  if (!Number.isFinite(mm) || mm > 10000)
    return {
      mm: null,
      error:
        "That looks unusual for a wrist circumference. Please measure again.",
    };
  return { mm, error: null };
};

export const formatWristMeasurement = (mm: number, unit: "cm" | "in") =>
  unit === "cm"
    ? (mm / 10).toFixed(1).replace(/\.0$/, "")
    : (mm / 25.4).toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
