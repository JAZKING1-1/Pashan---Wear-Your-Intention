import { rashiGuide } from "./products";

const imageModules = import.meta.glob(
  "/src/assets/rakhi/rashi/**/*.{png,jpg,jpeg}",
  { eager: true, as: "url" },
);

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
    const slug = zodiac === "capricorn" ? "capricorn" : zodiac; // The folder is 'capricon'

    const images = Object.entries(imageModules)
      .filter(([path]) =>
        path.includes(
          `/src/assets/rakhi/rashi/${zodiac === "capricorn" ? "capricon" : zodiac}/`,
        ),
      )
      .map(([, url]) => url as string);

    if (images.length === 0) return;

    const hero =
      images.find(
        (img) =>
          img.toLowerCase().includes(zodiac) &&
          !img.toLowerCase().includes(" "),
      ) || images[0];
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
