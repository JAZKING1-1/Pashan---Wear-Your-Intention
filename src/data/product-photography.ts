// User-owned original photographs, reviewed against existing catalogue references.
// Drive sources and resize-only derivation: docs/original-photo-manifest.json.
const originals: Record<string, { name: string; count: number }> = {
  pyrite: { name: "Pyrite", count: 2 },
  "tiger-eye": { name: "Tiger Eye", count: 2 },
  hematite: { name: "Hematite", count: 2 },
  amethyst: { name: "Amethyst", count: 2 },
  "green-quartz": { name: "Green Quartz", count: 2 },
  lava: { name: "Lava Stone", count: 1 },
  "dhan-yog": { name: "Dhan Yog", count: 3 },
};

export function cataloguePhotos(slug: string) {
  const custom = slug === "make-your-own";
  const source = custom ? "dhan-yog" : slug;
  const { name, count } = originals[source];
  const images = Array.from(
    { length: count },
    (_, i) => `/images/originals/${source}-${i + 1}-960.webp`,
  );
  const imageAlts = images.map((_, i) => {
    const view =
      source === "dhan-yog" && i === 2
        ? "held in a hand in sunlight"
        : source === "lava"
          ? "on green cloth in natural light"
          : "on ivory cloth in natural light";
    return custom
      ? `Composition inspiration: an existing Dhan Yog bracelet ${view}, not your finished custom design`
      : `${name} bracelet ${view}, photograph ${i + 1}`;
  });
  return { image: images[0], images, imageAlts };
}

export function originalPhotoSrcSet(src: string) {
  return src.startsWith("/images/originals/") && src.endsWith("-960.webp")
    ? `${src.replace("-960.webp", "-480.webp")} 480w, ${src} 960w`
    : undefined;
}

export function originalPhotoDimensions(src: string) {
  return { width: 960, height: src.includes("pyrite-2-") ? 1280 : 1707 };
}
