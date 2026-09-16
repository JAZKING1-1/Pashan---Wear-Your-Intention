// Photo provenance: docs/rashi-drive-manifest.json. Materials are not inferred from colour.
export const RASHI_OFFER = {
  price: 899,
  requestedComparisonPrice: 1499,
  comparisonStatus: "awaiting-owner-confirmation",
  label: "Introductory offer",
} as const;
const signs = [
  [
    "aries",
    "Aries",
    "मेष",
    "♈",
    "Begin with courage.",
    "What small beginning deserves your attention today?",
  ],
  [
    "taurus",
    "Taurus",
    "वृषभ",
    "♉",
    "Return to what matters.",
    "Make room for something you truly value.",
  ],
  [
    "gemini",
    "Gemini",
    "मिथुन",
    "♊",
    "Stay open to wonder.",
    "Ask a question. Listen a little longer.",
  ],
  [
    "cancer",
    "Cancer",
    "कर्क",
    "♋",
    "Carry your connections.",
    "Who would appreciate a thoughtful word from you?",
  ],
  [
    "leo",
    "Leo",
    "सिंह",
    "♌",
    "Let generosity lead.",
    "Offer your attention without asking for anything back.",
  ],
  [
    "virgo",
    "Virgo",
    "कन्या",
    "♍",
    "Find beauty in care.",
    "One small act of care is enough to begin.",
  ],
  [
    "libra",
    "Libra",
    "तुला",
    "♎",
    "Make space for balance.",
    "What could you put down for a moment?",
  ],
  [
    "scorpio",
    "Scorpio",
    "वृश्चिक",
    "♏",
    "Choose with intention.",
    "Notice what you want to carry forward, and what you do not.",
  ],
  [
    "sagittarius",
    "Sagittarius",
    "धनु",
    "♐",
    "Keep your curiosity.",
    "Find something new in a familiar place.",
  ],
  [
    "capricorn",
    "Capricorn",
    "मकर",
    "♑",
    "Honour the small steps.",
    "Give yourself credit for the quiet work.",
  ],
  [
    "aquarius",
    "Aquarius",
    "कुंभ",
    "♒",
    "See another possibility.",
    "What might change if you looked at it differently?",
  ],
  [
    "pisces",
    "Pisces",
    "मीन",
    "♓",
    "Leave room for gentleness.",
    "Let one moment today be unhurried.",
  ],
] as const;
export const rashiCatalogue = signs.map(
  ([slug, name, hindi, symbol, intention, reflection]) => ({
    slug,
    name,
    hindi,
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
