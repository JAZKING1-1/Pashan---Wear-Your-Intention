import packagingCardboard from "../assets/brand/packaging-cardboard.webp";
import packagingOverhead from "../assets/brand/packaging-overhead.webp";
import packagingRitual from "../assets/brand/packaging-ritual.webp";
import amethyst01 from "../assets/products/amethyst/01.webp";
import amethyst02 from "../assets/products/amethyst/02.webp";
import amethyst03 from "../assets/products/amethyst/03.webp";
import amethyst04 from "../assets/products/amethyst/04.webp";
import greenQuartz01 from "../assets/products/green-quartz/01.webp";
import greenQuartz02 from "../assets/products/green-quartz/02.webp";
import greenQuartz03 from "../assets/products/green-quartz/03.webp";
import greenQuartz04 from "../assets/products/green-quartz/04.webp";
import greenQuartz05 from "../assets/products/green-quartz/05.webp";
import greenQuartz06 from "../assets/products/green-quartz/06.webp";
import greenQuartz07 from "../assets/products/green-quartz/07.webp";
import greenQuartz08 from "../assets/products/green-quartz/08.webp";
import hematite01 from "../assets/products/hematite/01.webp";
import hematite02 from "../assets/products/hematite/02.webp";
import hematite03 from "../assets/products/hematite/03.webp";
import hematite04 from "../assets/products/hematite/04.webp";
import hematite05 from "../assets/products/hematite/05.webp";
import hematite06 from "../assets/products/hematite/06.webp";
import hematite07 from "../assets/products/hematite/07.webp";
import hematite08 from "../assets/products/hematite/08.webp";
import hematite09 from "../assets/products/hematite/09.webp";
import hematite10 from "../assets/products/hematite/10.webp";
import hematite11 from "../assets/products/hematite/11.webp";
import hematite12 from "../assets/products/hematite/12.webp";
import dhanYog01 from "../assets/products/dhan-yog/01.webp";
import dhanYog02 from "../assets/products/dhan-yog/02.webp";
import dhanYog03 from "../assets/products/dhan-yog/03.webp";
import dhanYog04 from "../assets/products/dhan-yog/04.webp";
import dhanYog05 from "../assets/products/dhan-yog/05.webp";
import dhanYog06 from "../assets/products/dhan-yog/06.webp";
import dhanYog07 from "../assets/products/dhan-yog/07.webp";
import lava01 from "../assets/products/lava/01.webp";
import lava02 from "../assets/products/lava/02.webp";
import lava03 from "../assets/products/lava/03.webp";
import lava04 from "../assets/products/lava/04.webp";
import lava05 from "../assets/products/lava/05.webp";
import lava06 from "../assets/products/lava/06.webp";
import lava07 from "../assets/products/lava/07.webp";
import lava08 from "../assets/products/lava/08.webp";
import makeYourOwnImage from "../assets/products/make-your-own.webp";
import pyrite01 from "../assets/products/pyrite/01.webp";
import pyrite02 from "../assets/products/pyrite/02.webp";
import pyrite03 from "../assets/products/pyrite/03.webp";
import pyrite04 from "../assets/products/pyrite/04.webp";
import pyrite05 from "../assets/products/pyrite/05.webp";
import pyrite06 from "../assets/products/pyrite/06.webp";
import tigerEye01 from "../assets/products/tiger-eye/01.webp";
import tigerEye02 from "../assets/products/tiger-eye/02.webp";
import tigerEye03 from "../assets/products/tiger-eye/03.webp";
import tigerEye04 from "../assets/products/tiger-eye/04.webp";
import tigerEye05 from "../assets/products/tiger-eye/05.webp";
import tigerEye06 from "../assets/products/tiger-eye/06.webp";
import tigerEye07 from "../assets/products/tiger-eye/07.webp";
import tigerEye08 from "../assets/products/tiger-eye/08.webp";

const packagingImages = [
  packagingCardboard,
  packagingRitual,
  packagingOverhead,
];
const packagingAlts = [
  "Open kraft PASHAN gifting box with bracelet, intention card, authenticity details and Ganga Jal",
  "Angled view of the ivory PASHAN bracelet presentation",
  "Overhead view of the ivory PASHAN bracelet presentation",
];

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
    image: pyrite03,
    images: [
      pyrite03,
      pyrite04,
      pyrite05,
      pyrite06,
      pyrite01,
      pyrite02,
      ...packagingImages,
    ],
    imageAlts: [
      "Pyrite bracelet presented on a river stone at golden hour",
      "Pyrite bracelet worn beside the river in warm natural light",
      "Pyrite bracelet photographed on hand-finished walnut",
      "Pop-art Pyrite campaign image in ochre, teal and ink",
      "Natural Pyrite bracelet in sunlight",
      "Close view of the metallic Pyrite beads",
      ...packagingAlts,
    ],
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
    images: [
      tigerEye02,
      tigerEye03,
      tigerEye04,
      tigerEye05,
      tigerEye06,
      tigerEye07,
      tigerEye08,
      tigerEye01,
      ...packagingImages,
    ],
    imageAlts: [
      "Tiger Eye bracelet presented beside a Himalayan river at golden hour",
      "Tiger Eye bracelet worn on the wrist in warm natural light",
      "Tiger Eye bracelet photographed on hand-finished walnut",
      "Pop-art Tiger Eye campaign image in ochre, teal and ink",
      "Tiger Eye bracelet beside the Ganga at sunset",
      "Tiger Eye bracelet on a rain-dark stone in the forest",
      "Tiger Eye bracelet beside the Ganga beneath a PASHAN courage message",
      "Natural Tiger Eye bracelet with golden brown banding",
      ...packagingAlts,
    ],
    image: tigerEye02,
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
    image: hematite07,
    images: [
      hematite07,
      hematite08,
      hematite09,
      hematite10,
      hematite11,
      hematite12,
      hematite01,
      hematite02,
      hematite03,
      hematite04,
      hematite05,
      hematite06,
      ...packagingImages,
    ],
    imageAlts: [
      "Hematite bracelet presented on a river stone with PASHAN campaign typography",
      "Hematite bracelet worn beside the river in warm natural light",
      "Pop-art Hematite campaign image in ochre, teal and ink",
      "Hematite bracelet photographed on hand-finished walnut",
      "Hematite bracelet beside the Ganga at sunset",
      "Hematite bracelet presented on soft ivory cloth",
      "Natural Hematite bracelet on ivory cloth",
      "Hematite bracelet showing its dark metallic polish",
      "Close angle of rounded Hematite beads",
      "Hematite bracelet in direct natural light",
      "Detailed view of the Hematite finish",
      "Hematite bracelet photographed from above",
      ...packagingAlts,
    ],
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
    image: amethyst03,
    images: [
      amethyst03,
      amethyst04,
      amethyst01,
      amethyst02,
      ...packagingImages,
    ],
    imageAlts: [
      "Amethyst bracelet presented on a river stone with PASHAN campaign typography",
      "Amethyst bracelet worn beside the river in warm natural light",
      "Natural purple Amethyst bracelet in sunlight",
      "Close view of translucent Amethyst beads",
      ...packagingAlts,
    ],
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
    image: greenQuartz06,
    images: [
      greenQuartz06,
      greenQuartz07,
      greenQuartz08,
      greenQuartz01,
      greenQuartz02,
      greenQuartz03,
      greenQuartz04,
      greenQuartz05,
      ...packagingImages,
    ],
    imageAlts: [
      "Green Quartz bracelet presented on a river stone with PASHAN campaign typography",
      "Green Quartz bracelet worn beside the river in warm natural light",
      "Green Quartz bracelet photographed on ivory cloth and hand-finished wood",
      "Natural Green Quartz bracelet in sunlight",
      "Close view of translucent Green Quartz beads",
      "Green Quartz bracelet photographed from above",
      "Green Quartz bracelet held in natural light",
      "Detailed view of the Green Quartz colour variation",
      ...packagingAlts,
    ],
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
    image: lava02,
    images: [
      lava02,
      lava03,
      lava04,
      lava05,
      lava06,
      lava07,
      lava08,
      lava01,
      ...packagingImages,
    ],
    imageAlts: [
      "Lava Stone bracelet beside the Ganga at sunset",
      "Lava Stone bracelet worn in the Himalayan foothills",
      "Lava Stone bracelet photographed on hand-finished walnut",
      "Lava Stone bracelet resting on a mossy woodland stone",
      "Lava Stone bracelet on ivory paper in dappled light",
      "Lava Stone bracelet composed on natural charcoal cloth",
      "Lava Stone bracelet beside a clear Himalayan river",
      "Natural porous Lava Stone bracelet on green cloth",
      ...packagingAlts,
    ],
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
    image: dhanYog01,
    images: [
      dhanYog01,
      dhanYog02,
      dhanYog03,
      dhanYog04,
      dhanYog05,
      dhanYog06,
      dhanYog07,
      ...packagingImages,
    ],
    imageAlts: [
      "Dhan Yog five-stone bracelet presented beside a Himalayan river",
      "Dhan Yog bracelet worn in the Himalayan foothills",
      "Dhan Yog bracelet showing Green Aventurine, Tiger Eye, Pyrite, Citrine and Hematite",
      "Pop-art Dhan Yog campaign image describing opportunity, focus and prosperity",
      "Dhan Yog bracelet beside the Ganga at sunset",
      "Dhan Yog bracelet resting on a woodland stone",
      "Dhan Yog five-stone bracelet presented on ivory paper",
      ...packagingAlts,
    ],
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
    image: makeYourOwnImage,
    images: [makeYourOwnImage, ...packagingImages],
    imageAlts: [
      "Custom PASHAN multistone bracelet on handmade ivory paper",
      ...packagingAlts,
    ],
    tone: "custom",
    beadSize: "8 mm",
    finish: "Mixed natural polish and matte",
    origin: "Composed in India",
    fit: "Free size - composed to order",
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
  { key: "confidence", label: "Courage", slug: "tiger-eye" },
  { key: "prosperity", label: "Prosperity", slug: "pyrite" },
  { key: "focus", label: "Focus", slug: "hematite" },
  { key: "growth", label: "Growth", slug: "green-quartz" },
  { key: "balance", label: "Balance", slug: "dhan-yog" },
  { key: "stillness", label: "Stillness", slug: "amethyst" },
] as const;

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
