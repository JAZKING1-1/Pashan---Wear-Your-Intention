import { rashiGuide } from "./products";

const imageModules = import.meta.glob('/src/assets/rakhi/rashi/**/*.{png,jpg,jpeg}', { eager: true, import: 'default' });

function getAssetUrl(mod: unknown): string {
  if (typeof mod === "string") return mod;
  if (
    mod &&
    typeof mod === "object" &&
    "default" in mod &&
    typeof (mod as { default: unknown }).default === "string"
  ) {
    return (mod as { default: string }).default;
  }
  return String(mod ?? "");
}

export interface RashiProductData {
  slug: string;
  name: string;
  blessing: string;
  gemstones: string[];
  heroImage: string;
  galleryImages: string[];
  description: string;
  meaning: string;
  benefits: string[];
  inclusions: string[];
  story: string[];
  craftsmanshipSteps: { title: string; description: string; image: string }[];
}

export const rashiProductsData: Record<string, RashiProductData> = {};

rashiGuide
  .filter(item => item.sign.toLowerCase() !== 'scorpio')
  .forEach((guide) => {
    const zodiac = guide.sign.toLowerCase();
    const slug = zodiac === 'capricorn' ? 'capricorn' : zodiac; 

    const images = Object.entries(imageModules)
      .filter(([path]) => path.includes(`/src/assets/rakhi/rashi/${zodiac === 'capricorn' ? 'capricon' : zodiac}/`))
      .map(([, mod]) => getAssetUrl(mod));

    if (images.length === 0) return;

    const heroImage = images.find(img => typeof img === 'string' && img.toLowerCase().includes(zodiac) && !img.toLowerCase().includes(' ')) || images[0] || '';
    const galleryImages = images; // Use all for gallery

    rashiProductsData[slug] = {
      slug,
      name: guide.sign,
      blessing: guide.note,
      gemstones: guide.stones.split(',').map(s => s.trim()),
      heroImage,
      galleryImages,
      description: `The ${guide.sign} Rakhi, ${guide.note.toLowerCase()}`,
      meaning: `The ${guide.sign} sign is governed by intention, balance, and natural energy. This Rakhi is designed as a daily reminder of your unique qualities.`,
      benefits: [
        "Symbol of Blessings",
        "Handmade with Natural Gemstones",
        "HRG Certified Authenticity",
        "Premium Gift Presentation",
        "Adjustable for Every Wrist"
      ],
      inclusions: [
        "Natural Gemstone Rakhi",
        "HRG Authenticity Certificate",
        "Premium Gift Box",
        "Decorative Diya",
        "Roli & Chawal",
        "Premium Chocolate",
        "Panchmeva",
        "Dhoop Cones"
      ],
      story: [
        "Every PASHAN Rakhi is crafted with an intention to transcend the festive moment.",
        "Drawing on ancient traditions, we select stones that align with your zodiac's essence, ensuring a meaningful, enduring connection.",
        "This is not just a thread, but a curated experience."
      ],
      craftsmanshipSteps: [
        { title: "Gemstone Selection", description: "Each stone is inspected for clarity and tone.", image: heroImage },
        { title: "Hand-knotting", description: "Our artisans knot each bead with focus and patience.", image: heroImage },
        { title: "Quality Inspection", description: "Final certification ensures premium quality.", image: heroImage }
      ]
    };
  });

