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

// Optically reviewed against the originals: similar apparent bracelet width,
// complete bead rings and shadows. Coordinates are image %, not product sizing.
const framing: Record<string, { width: number; x: number; y: number }> = {
  "pyrite-1": { width: 103, x: 51, y: 50 },
  "pyrite-2": { width: 108, x: 48, y: 62 },
  "tiger-eye-1": { width: 116, x: 50, y: 52 },
  "tiger-eye-2": { width: 116, x: 55, y: 57 },
  "hematite-1": { width: 110, x: 51, y: 54 },
  "hematite-2": { width: 117, x: 49, y: 47 },
  "amethyst-1": { width: 128, x: 49, y: 46 },
  "amethyst-2": { width: 139, x: 53, y: 52 },
  "green-quartz-1": { width: 113, x: 50, y: 59 },
  "green-quartz-2": { width: 139, x: 51, y: 47 },
  "lava-1": { width: 120, x: 52, y: 49 },
  "dhan-yog-1": { width: 116, x: 47, y: 51 },
  "dhan-yog-2": { width: 110, x: 50, y: 52 },
};

export function photoFraming(src: string) {
  const key =
    src
      .split("/")
      .pop()
      ?.replace(/-(480|960)\.webp$/, "") ?? "";
  return framing[key] ?? { width: 100, x: 50, y: 50 };
}
