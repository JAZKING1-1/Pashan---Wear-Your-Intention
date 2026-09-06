import { collections, type Collection } from "@/data/products";

const aliases: Record<string, string[]> = {
  "tiger-eye": ["tiger eye", "tiger's eye", "tigereye"],
  "green-quartz": ["green quartz"],
  "dhan-yog": ["dhan yog", "dhanyog", "balance"],
  "make-your-own": ["custom", "custom bracelet", "make your own", "builder"],
  pyrite: ["abundance", "prosperity"],
  hematite: ["focus", "grounding"],
  amethyst: ["stillness", "calm"],
  lava: ["lava stone", "resilience"],
};

export const normalizeSearch = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[‘’`]/g, "'")
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/[^a-z0-9' -]+/g, " ")
    .replace(/[-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export interface SearchResult {
  product: Collection;
  score: number;
}

const fieldsFor = (product: Collection) => ({
  names: [
    product.title,
    product.stone,
    product.name,
    ...(aliases[product.slug] ?? []),
  ].map(normalizeSearch),
  stone: normalizeSearch(product.stone),
  qualities: product.qualities.map(normalizeSearch),
  broad: normalizeSearch(
    [product.subtitle, product.intention, product.story].join(" "),
  ),
});

export const searchCatalogue = (rawQuery: string): SearchResult[] => {
  const query = normalizeSearch(rawQuery);
  if (!query) return [];
  const tokens = query.split(" ");
  return collections
    .map((product) => {
      const fields = fieldsFor(product);
      let score = 0;
      if (fields.names.includes(query)) score = 100;
      else if (fields.names.some((value) => value.startsWith(query)))
        score = 80;
      else if (fields.stone.includes(query)) score = 65;
      else if (fields.qualities.some((value) => value.includes(query)))
        score = 50;
      else if (
        tokens.every((token) =>
          [...fields.names, ...fields.qualities, fields.broad].some((value) =>
            value.includes(token),
          ),
        )
      )
        score = 25;
      return { product, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.product.title.localeCompare(b.product.title),
    );
};

export const exploreProducts = collections
  .filter((product) => !product.isCustom)
  .slice(0, 5);
