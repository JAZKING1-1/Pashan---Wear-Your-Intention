// Photo provenance: docs/rashi-drive-manifest.json. Materials are not inferred from colour.
export const RASHI_OFFER = {
  price: 899,
  requestedComparisonPrice: 1499,
  comparisonStatus: "awaiting-owner-confirmation",
  label: "Introductory offer",
} as const;
// `hindi` is the sign written in Devanagari; `sanskrit` is the same word in
// Latin letters, not a second name and not a separate claim.
const signs = [
  [
    "aries",
    "Aries",
    "मेष",
    "Meṣa",
    "♈",
    "Begin with courage.",
    "What small beginning deserves your attention today?",
  ],
  [
    "taurus",
    "Taurus",
    "वृषभ",
    "Vṛṣabha",
    "♉",
    "Return to what matters.",
    "Make room for something you truly value.",
  ],
  [
    "gemini",
    "Gemini",
    "मिथुन",
    "Mithuna",
    "♊",
    "Stay open to wonder.",
    "Ask a question. Listen a little longer.",
  ],
  [
    "cancer",
    "Cancer",
    "कर्क",
    "Karka",
    "♋",
    "Carry your connections.",
    "Who would appreciate a thoughtful word from you?",
  ],
  [
    "leo",
    "Leo",
    "सिंह",
    "Siṃha",
    "♌",
    "Let generosity lead.",
    "Offer your attention without asking for anything back.",
  ],
  [
    "virgo",
    "Virgo",
    "कन्या",
    "Kanyā",
    "♍",
    "Find beauty in care.",
    "One small act of care is enough to begin.",
  ],
  [
    "libra",
    "Libra",
    "तुला",
    "Tulā",
    "♎",
    "Make space for balance.",
    "What could you put down for a moment?",
  ],
  [
    "scorpio",
    "Scorpio",
    "वृश्चिक",
    "Vṛścika",
    "♏",
    "Choose with intention.",
    "Notice what you want to carry forward, and what you do not.",
  ],
  [
    "sagittarius",
    "Sagittarius",
    "धनु",
    "Dhanu",
    "♐",
    "Keep your curiosity.",
    "Find something new in a familiar place.",
  ],
  [
    "capricorn",
    "Capricorn",
    "मकर",
    "Makara",
    "♑",
    "Honour the small steps.",
    "Give yourself credit for the quiet work.",
  ],
  [
    "aquarius",
    "Aquarius",
    "कुंभ",
    "Kumbha",
    "♒",
    "See another possibility.",
    "What might change if you looked at it differently?",
  ],
  [
    "pisces",
    "Pisces",
    "मीन",
    "Mīna",
    "♓",
    "Leave room for gentleness.",
    "Let one moment today be unhurried.",
  ],
] as const;
export const rashiCatalogue = signs.map(
  ([slug, name, hindi, sanskrit, symbol, intention, reflection]) => ({
    slug,
    name,
    hindi,
    sanskrit,
    symbol: symbol + "\uFE0E",
    intention,
    reflection,
    title: name + " Rashi Rakhi",
    price: RASHI_OFFER.price,
    image: "/images/rashi/" + slug + "-480.webp",
    imageLarge: "/images/rashi/" + slug + "-960.webp",
    landscape: ["taurus", "virgo", "sagittarius", "aquarius"].includes(slug),
    availability: "confirmation-required" as const,
  }),
);
export type RashiProduct = (typeof rashiCatalogue)[number];
export const findRashi = (slug: string) =>
  rashiCatalogue.find((product) => product.slug === slug);
export const rashiEnquiry = (product: RashiProduct) =>
  "https://wa.me/447767956428?text=" +
  encodeURIComponent(
    "Namaste PASHAN. I am interested in the " +
      product.title +
      " at the ₹899 introductory price. Please confirm availability, materials, fit, packaging, delivery costs and dispatch time before I order.",
  );

// "Not sure of your Rashi?" ----------------------------------------------------
// A loose sun-sign guide so someone without a birth chart has somewhere to
// start. It is deliberately the plain public convention and nothing more: a
// Vedic Rashi is worked out from a birth time and place, which a date alone
// cannot give, and the finder says so on the panel rather than implying more.
const cusps: readonly (readonly [number, number, string])[] = [
  [0, 20, "aquarius"],
  [1, 19, "pisces"],
  [2, 21, "aries"],
  [3, 20, "taurus"],
  [4, 21, "gemini"],
  [5, 21, "cancer"],
  [6, 23, "leo"],
  [7, 23, "virgo"],
  [8, 23, "libra"],
  [9, 23, "scorpio"],
  [10, 22, "sagittarius"],
  [11, 22, "capricorn"],
];
const dayOfYear = (year: number, month: number, day: number) =>
  Math.round((Date.UTC(year, month, day) - Date.UTC(year, 0, 1)) / 86_400_000);
export type RashiGuide = { slug: string; cusp: boolean };
export function guideToRashi(date: Date): RashiGuide | null {
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const today = dayOfYear(year, date.getMonth(), date.getDate());
  const marks = cusps
    .map(([month, day, slug]) => ({ at: dayOfYear(year, month, day), slug }))
    .sort((a, b) => a.at - b.at);
  // A birthday in early January sits before this year's first cusp, so the
  // default is the one that opened the year.
  let current = marks[marks.length - 1];
  for (const mark of marks) if (today >= mark.at) current = mark;
  const next = marks.find((mark) => mark.at > today);
  const boundary = next ? next.at : marks[0].at + 365;
  // On a cusp the date genuinely falls between two signs. Say that instead of
  // picking one and sounding certain about it.
  const cusp =
    today - current.at <= 2 || boundary - today <= 2 ? true : false;
  return { slug: current.slug, cusp };
}
export const rashiFinderNote =
  "This is a guide to help you find your sign. It is not a birth-chart reading.";
