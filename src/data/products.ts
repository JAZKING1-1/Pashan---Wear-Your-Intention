import { cataloguePhotos } from "./product-photography";

export interface Collection {
  slug: string;
  name: string;
  title: string;
  stone: string;
  subtitle: string;
  qualities: string[];
  intention: string;
  ritual: string;
  story: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images: string[];
  imageAlts: string[];
  tone: string;
  beadSize: string;
  finish: string;
  origin: string;
  fit: string;
  isCustom?: boolean;
  badge?: string;
}

export const LAUNCH_PRICE = 899;
export const LAUNCH_COMPARE_AT_PRICE = 1500;
export const LAUNCH_SAVING = LAUNCH_COMPARE_AT_PRICE - LAUNCH_PRICE;

export type CustomStoneKey =
  | "pyrite"
  | "tiger-eye"
  | "hematite"
  | "amethyst"
  | "green-quartz"
  | "lava"
  | "heart-quartz"
  | "citrine";

export interface CustomStoneOption {
  key: CustomStoneKey;
  label: string;
  qualities: string[];
  description: string;
}

export const customStoneOptions: CustomStoneOption[] = [
  {
    key: "pyrite",
    label: "Pyrite",
    qualities: ["Confidence", "Courage", "Abundance"],
    description: "Metallic warmth for purposeful beginnings.",
  },
  {
    key: "tiger-eye",
    label: "Tiger Eye",
    qualities: ["Confidence", "Courage", "Protection"],
    description: "Golden banding for composure and direction.",
  },
  {
    key: "hematite",
    label: "Hematite",
    qualities: ["Stability", "Focus", "Grounding"],
    description: "Mirror-dark balance for disciplined hours.",
  },
  {
    key: "amethyst",
    label: "Amethyst",
    qualities: ["Calm", "Balance", "Clarity"],
    description: "Violet depth for reflection and quiet focus.",
  },
  {
    key: "green-quartz",
    label: "Green Quartz",
    qualities: ["Growth", "Positivity", "Renewal"],
    description: "Fresh colour for a considered new chapter.",
  },
  {
    key: "lava",
    label: "Lava Stone",
    qualities: ["Strength", "Courage", "Resilience"],
    description: "Elemental texture for change and endurance.",
  },
  {
    key: "heart-quartz",
    label: "Heart Quartz",
    qualities: ["Love", "Compassion", "Harmony"],
    description: "Soft rose colour for warmth, care, and open connection.",
  },
  {
    key: "citrine",
    label: "Citrine",
    qualities: ["Optimism", "Creativity", "Abundance"],
    description: "Golden clarity for bright ideas and confident momentum.",
  },
];

export const describeCustomComposition = (beads: CustomStoneKey[]) => {
  const counts = new Map<CustomStoneKey, number>();
  beads.forEach((bead) => counts.set(bead, (counts.get(bead) ?? 0) + 1));

  return customStoneOptions
    .filter((stone) => counts.has(stone.key))
    .map((stone) => `${counts.get(stone.key)} ${stone.label}`)
    .join(" + ");
};

const repeatStonePattern = (
  pattern: CustomStoneKey[],
  length = 18,
): CustomStoneKey[] =>
  Array.from({ length }, (_, index) => pattern[index % pattern.length]!);

export interface CustomPreset {
  key: string;
  label: string;
  stones: string;
  note: string;
  sequence: CustomStoneKey[];
}

export const customPresets: CustomPreset[] = [
  {
    key: "prem-sutra",
    label: "Prem Sutra",
    stones: "Green Quartz + Amethyst + Pyrite",
    note: "A warm composition traditionally associated with openness, calm, and joyful connection.",
    sequence: repeatStonePattern(["green-quartz", "amethyst", "pyrite"]),
  },
  {
    key: "shanti-dhara",
    label: "Shanti Dhara",
    stones: "Amethyst + Hematite + Lava Stone",
    note: "A quieter palette for reflection, steady routines, and considered attention.",
    sequence: repeatStonePattern(["amethyst", "hematite", "lava"]),
  },
  {
    key: "shakti-path",
    label: "Shakti Path",
    stones: "Tiger Eye + Pyrite + Hematite",
    note: "A bold, metallic composition for courage, direction, and disciplined action.",
    sequence: repeatStonePattern(["tiger-eye", "pyrite", "hematite"]),
  },
  {
    key: "nayi-disha",
    label: "Nayi Disha",
    stones: "Green Quartz + Tiger Eye + Amethyst",
    note: "A fresh combination for new chapters, balanced decisions, and forward movement.",
    sequence: repeatStonePattern(["green-quartz", "tiger-eye", "amethyst"]),
  },
];

export const collections: Collection[] = [
  {
    slug: "pyrite",
    name: "Prosperity",
    title: "The Pyrite Bracelet",
    stone: "Pyrite",
    subtitle: "Metallic lustre for ambitious beginnings",
    qualities: ["Confidence", "Courage", "Abundance"],
    intention: "For the future you are building.",
    ritual:
      "Wear during planning, negotiations, or the first hours of a new project as a symbol of disciplined ambition.",
    story:
      "Pyrite has been traditionally associated with prosperity and opportunity. PASHAN treats that history as a reminder of meaningful work, not a promise of luck.",
    price: LAUNCH_PRICE,
    compareAtPrice: LAUNCH_COMPARE_AT_PRICE,
    ...cataloguePhotos("pyrite"),
    tone: "prosperity",
    beadSize: "8 mm",
    finish: "Natural polish",
    origin: "Peru",
    fit: "Free size",
  },
  {
    slug: "tiger-eye",
    name: "Leadership",
    title: "The Tiger Eye Bracelet",
    stone: "Tiger Eye",
    subtitle: "Banded stone for courage and a steady gaze",
    qualities: ["Confidence", "Courage", "Protection"],
    intention: "Worn by those who decide.",
    ritual:
      "Wear before important meetings, presentations, journeys, or decisions as a private reminder to move with a steady gaze.",
    story:
      "Tiger Eye has long been carried as a symbol of courage, composure, and clear intention. Its shifting golden bands reward a slower look and make every piece naturally distinct.",
    price: LAUNCH_PRICE,
    compareAtPrice: LAUNCH_COMPARE_AT_PRICE,
    ...cataloguePhotos("tiger-eye"),
    tone: "leadership",
    beadSize: "8 mm",
    finish: "Natural polish",
    origin: "South Africa",
    fit: "Free size",
    badge: "House favourite",
  },
  {
    slug: "hematite",
    name: "Grounding",
    title: "The Hematite Bracelet",
    stone: "Hematite",
    subtitle: "Mirror-dark stone for disciplined hours",
    qualities: ["Stability", "Focus", "Grounding"],
    intention: "For the depth of your work.",
    ritual:
      "Wear during study, training, focused work, or any period that asks you to remain steady and present.",
    story:
      "Hematite is an iron-rich stone valued since antiquity. Its cool weight and silver-black surface have made it an enduring symbol of steadiness, discipline, and resolve.",
    price: LAUNCH_PRICE,
    compareAtPrice: LAUNCH_COMPARE_AT_PRICE,
    ...cataloguePhotos("hematite"),
    tone: "focus",
    beadSize: "8 mm",
    finish: "High polish",
    origin: "Brazil",
    fit: "Free size",
  },
  {
    slug: "amethyst",
    name: "Stillness",
    title: "The Amethyst Bracelet",
    stone: "Amethyst",
    subtitle: "Violet depth for quieter hours",
    qualities: ["Calm", "Balance", "Clarity"],
    intention: "For the quieter hours.",
    ritual:
      "Wear while reading, journaling, meditating, or making room for a slower rhythm.",
    story:
      "Amethyst has been treasured across cultures for its saturated violet colour and traditional association with considered thought. Every bracelet carries natural shifts in tone and clarity.",
    price: LAUNCH_PRICE,
    compareAtPrice: LAUNCH_COMPARE_AT_PRICE,
    ...cataloguePhotos("amethyst"),
    tone: "balance",
    beadSize: "8 mm",
    finish: "Natural polish",
    origin: "Brazil",
    fit: "Free size",
  },
  {
    slug: "green-quartz",
    name: "Renewal",
    title: "The Green Quartz Bracelet",
    stone: "Green Quartz",
    subtitle: "Fresh colour for the next chapter",
    qualities: ["Growth", "Positivity", "Success"],
    intention: "For everything you have yet to become.",
    ritual:
      "Wear when beginning again: a project, a practice, a season, or a more deliberate daily rhythm.",
    story:
      "Green Quartz is traditionally connected to growth and renewal, the colour of first leaves and seasons turning. No two beads carry exactly the same clouding or depth.",
    price: LAUNCH_PRICE,
    compareAtPrice: LAUNCH_COMPARE_AT_PRICE,
    ...cataloguePhotos("green-quartz"),
    tone: "growth",
    beadSize: "8 mm",
    finish: "Natural polish",
    origin: "Brazil",
    fit: "Free size",
  },
  {
    slug: "lava",
    name: "Resilience",
    title: "The Lava Stone Bracelet",
    stone: "Lava Stone",
    subtitle: "Earth transformed by fire",
    qualities: ["Strength", "Courage", "Resilience"],
    intention: "Forged, not given.",
    ritual:
      "Wear through periods of change as a reminder that pressure can become form, texture, and strength.",
    story:
      "Lava Stone is the earth's record of pressure transformed into permanence. Porous and elemental, it carries a tactile honesty unlike any polished gemstone.",
    price: LAUNCH_PRICE,
    compareAtPrice: LAUNCH_COMPARE_AT_PRICE,
    ...cataloguePhotos("lava"),
    tone: "resilience",
    beadSize: "8 mm",
    finish: "Natural matte",
    origin: "India",
    fit: "Free size",
  },
  {
    slug: "dhan-yog",
    name: "Dhan Yog",
    title: "The Dhan Yog Bracelet",
    stone: "Dhan Yog",
    subtitle: "Five natural stones composed for purposeful beginnings",
    qualities: ["Opportunity", "Focus", "Prosperity"],
    intention: "A clear mind for the path ahead.",
    ritual:
      "Wear when starting a new project, planning your next move, or setting a practical intention for the season ahead.",
    story:
      "Dhan Yog brings Green Aventurine, Tiger Eye, Pyrite, Citrine, and Hematite into one balanced composition. These stones are traditionally associated with opportunity, focus, and prosperity; we offer those meanings as personal symbols, never promises.",
    price: LAUNCH_PRICE,
    compareAtPrice: LAUNCH_COMPARE_AT_PRICE,
    ...cataloguePhotos("dhan-yog"),
    tone: "dhan-yog",
    beadSize: "8 mm",
    finish: "Mixed natural polish",
    origin: "Composed in India",
    fit: "Free size",
    badge: "Five-stone composition",
  },
  {
    slug: "make-your-own",
    name: "Customisation Service",
    title: "Make Your Own Bracelet Customisation Service",
    stone: "Make Your Own Bracelet",
    subtitle: "Compose a one-of-one bracelet from eight natural stone choices",
    qualities: ["Personal", "Considered", "One of one"],
    intention: "Your stones. Your direction.",
    ritual:
      "Begin with the combination that speaks to you. Our team composes the final balance bead by bead and keeps in touch while your bracelet is prepared.",
    story:
      "Make Your Own brings eight natural stone choices into one personal piece. Start with one of our suggestions or build bead by bead, then share any preference when our team confirms your composition.",
    price: LAUNCH_PRICE,
    compareAtPrice: LAUNCH_COMPARE_AT_PRICE,
    ...cataloguePhotos("make-your-own"),
    tone: "custom",
    beadSize: "8 mm",
    finish: "Mixed natural polish and matte",
    origin: "Composed in India",
    fit: "Fit confirmed before making",
    isCustom: true,
    badge: "Customise yours",
  },
];

export const getCollection = (slug: string) =>
  collections.find(
    (collection) =>
      collection.slug === slug ||
      (slug === "signature" && collection.slug === "dhan-yog"),
  );

export const intentions = [
  { key: "career", label: "Career", slug: "pyrite" },
  { key: "confidence", label: "Confidence", slug: "tiger-eye" },
  { key: "focus", label: "Focus", slug: "hematite" },
  { key: "growth", label: "Growth", slug: "green-quartz" },
  { key: "calm", label: "Calm", slug: "amethyst" },
  { key: "protection", label: "Protection", slug: "lava" },
  { key: "relationships", label: "Relationships", slug: "green-quartz" },
  { key: "leadership", label: "Leadership", slug: "tiger-eye" },
  { key: "balance", label: "Balance", slug: "amethyst" },
  { key: "productivity", label: "Productivity", slug: "hematite" },
] as const;

export const stoneIntentionWeights: Record<string, Record<string, number>> = {
  pyrite: { career: 5, productivity: 5, leadership: 3, growth: 2 },
  "tiger-eye": { confidence: 5, leadership: 5, productivity: 3, focus: 2 },
  hematite: { focus: 5, productivity: 5, balance: 2, protection: 2 },
  amethyst: { calm: 5, balance: 5, growth: 2, focus: 2 },
  "green-quartz": { growth: 5, relationships: 5, balance: 3, calm: 2 },
  lava: { protection: 5, confidence: 3, calm: 2, focus: 1 },
  "dhan-yog": { career: 4, growth: 4, relationships: 4, balance: 4 },
};

export const rashiGuide = [
  {
    sign: "Aries",
    stones: "Hematite, Tiger Eye",
    note: "For decisive, action-driven temperaments.",
  },
  {
    sign: "Taurus",
    stones: "Green Quartz, Amethyst",
    note: "For steady builders who value beauty and patience.",
  },
  {
    sign: "Gemini",
    stones: "Tiger Eye, Dhan Yog",
    note: "For curious minds and many-sided lives.",
  },
  {
    sign: "Cancer",
    stones: "Amethyst, Green Quartz",
    note: "For reflective hearts and considered emotion.",
  },
  {
    sign: "Leo",
    stones: "Pyrite, Tiger Eye",
    note: "For natural leaders and luminous presence.",
  },
  {
    sign: "Virgo",
    stones: "Hematite, Amethyst",
    note: "For meticulous craft and quiet excellence.",
  },
  {
    sign: "Libra",
    stones: "Green Quartz, Dhan Yog",
    note: "For seekers of balance and beauty.",
  },
  {
    sign: "Scorpio",
    stones: "Lava Stone, Hematite",
    note: "For depth, intensity, and unwavering will.",
  },
  {
    sign: "Sagittarius",
    stones: "Pyrite, Green Quartz",
    note: "For expansive ambition and new horizons.",
  },
  {
    sign: "Capricorn",
    stones: "Hematite, Pyrite",
    note: "For disciplined builders of long arcs.",
  },
  {
    sign: "Aquarius",
    stones: "Amethyst, Dhan Yog",
    note: "For original thinkers and quiet rebels.",
  },
  {
    sign: "Pisces",
    stones: "Amethyst, Green Quartz",
    note: "For poetic temperaments and inner worlds.",
  },
];

export const journal = [
  {
    slug: "the-discipline-of-confidence",
    category: "Confidence",
    title: "The Discipline of Confidence",
    excerpt: "Why composure is a practice, not a personality trait.",
  },
  {
    slug: "leadership-is-a-quiet-art",
    category: "Leadership",
    title: "Leadership Is a Quiet Art",
    excerpt: "On presence, decisions, and the weight of choosing.",
  },
  {
    slug: "the-architecture-of-prosperity",
    category: "Prosperity",
    title: "The Architecture of Prosperity",
    excerpt: "Wealth as discipline rendered over time.",
  },
  {
    slug: "focus-as-a-form-of-respect",
    category: "Focus",
    title: "Focus as a Form of Respect",
    excerpt: "What you give attention to, you give shape to.",
  },
  {
    slug: "the-stones-our-ancestors-trusted",
    category: "Ancient Wisdom",
    title: "The Stones Our Ancestors Trusted",
    excerpt: "How natural stones became symbols across cultures.",
  },
  {
    slug: "becoming-quietly",
    category: "Personal Growth",
    title: "Becoming, Quietly",
    excerpt: "On the small, daily acts of becoming someone new.",
  },
];
