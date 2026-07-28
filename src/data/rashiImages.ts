import { rashiGuide } from "./products";

const imageModules = import.meta.glob(
  "/src/assets/rakhi/rashi/**/*.{png,jpg,jpeg}",
  { eager: true, import: "default" },
);

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

export type RashiProduct = {
  slug: string;
  name: string;
  hero: string;
  gallery: string[];
  thumbnail: string;
  blessing: string;
  gemstone: string;
};

export const rashiProducts: Record<string, RashiProduct> = {};

rashiGuide
  .filter((item) => item.sign.toLowerCase() !== "scorpio")
  .forEach((guide) => {
    const zodiac = guide.sign.toLowerCase();
    const slug = zodiac === "capricorn" ? "capricorn" : zodiac;

    const images = Object.entries(imageModules)
      .filter(([path]) =>
        path.includes(
          `/src/assets/rakhi/rashi/${zodiac === "capricorn" ? "capricon" : zodiac}/`,
        ),
      )
      .map(([, mod]) => getAssetUrl(mod));

    if (images.length === 0) return;

    const hero =
      images.find(
        (img) =>
          typeof img === "string" &&
          img.toLowerCase().includes(zodiac) &&
          !img.toLowerCase().includes(" "),
      ) || images[0] || "";
    const gallery = images.filter((img) => img !== hero);

    rashiProducts[slug] = {
      slug,
      name: guide.sign,
      hero,
      gallery,
      thumbnail: hero,
      blessing: guide.note,
      gemstone: guide.stones,
    };
  });

