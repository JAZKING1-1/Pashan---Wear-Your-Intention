import type { CustomStoneKey } from "@/data/products";
import { stoneMaterials } from "@/data/bracelet-assets";
import { createStoneTextures } from "./stoneMaterials";

/**
 * Lightweight material previews for the stone selector and the suggested
 * combinations.
 *
 * These are not hand-painted stand-ins: every preview is painted from the very
 * same procedural colour, roughness and relief maps that the Three.js beads
 * use, then lit with the same key direction the studio rig uses. Rough stones
 * therefore get a broad dim highlight and polished stones a tight bright one,
 * so a card and its bead read as the same material.
 *
 * One small canvas per stone, generated once on the client, then handed to CSS
 * as a data URL. No second WebGL context, no per-card render loop.
 */

const SIZE = 128;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type StonePreview = {
  /** Squared preview of one bead, as a data URL. */
  bead: string;
  /** Same material as a wide strip, used for bracelet thumbnails. */
  strip: string;
};

/** Stable per-stone signature so previews stay identical between visits. */
const seedForStone = (stoneKey: CustomStoneKey) =>
  Array.from(stoneKey).reduce(
    (h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) & 2147483647,
    17,
  );

const cache = new Map<CustomStoneKey, StonePreview>();

export function stonePreview(stoneKey: CustomStoneKey): StonePreview {
  const cached = cache.get(stoneKey);
  if (cached) return cached;

  const seed = seedForStone(stoneKey);
  const recipe = stoneMaterials[stoneKey];
  const maps = createStoneTextures(stoneKey, seed % 8, 1);
  const colour = maps.map.image as HTMLCanvasElement;
  const roughness = maps.roughnessMap.image as HTMLCanvasElement;

  const beadCanvas = document.createElement("canvas");
  beadCanvas.width = SIZE;
  beadCanvas.height = SIZE;
  const bead = beadCanvas.getContext("2d")!;

  // Base colour, cropped from the middle of the map so the banding of a stone
  // is not sampled from its seam.
  const side = Math.min(colour.width, colour.height);
  bead.drawImage(
    colour,
    (colour.width - side) / 2,
    (colour.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );

  // Relief from the bump map, as a soft directional shade.
  const reliefCanvas = document.createElement("canvas");
  reliefCanvas.width = SIZE;
  reliefCanvas.height = SIZE;
  const relief = reliefCanvas.getContext("2d")!;
  relief.drawImage(
    maps.bumpMap.image as HTMLCanvasElement,
    0,
    0,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  const reliefImage = relief.getImageData(0, 0, SIZE, SIZE);
  const shade = bead.getImageData(0, 0, SIZE, SIZE);
  // Light comes from the upper left in the studio, so relief is read along the
  // same diagonal as the real specular response.
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const index = (y * SIZE + x) * 4;
      const here = reliefImage.data[index] / 255;
      const ahead = reliefImage.data[
        (Math.max(0, y - 2) * SIZE + Math.max(0, x - 2)) * 4
      ] / 255;
      const slope = clamp01((here - ahead) * 2.2 + 0.5);
      const light = lerp(0.78, 1.18, slope);
      for (let channel = 0; channel < 3; channel += 1)
        shade.data[index + channel] = clamp01(
          (shade.data[index + channel] / 255) * light,
        ) * 255;
    }
  }
  bead.putImageData(shade, 0, 0);

  // Spherical shading plus a highlight whose tightness follows roughness.
  const sphere = bead.createRadialGradient(
    SIZE * 0.32,
    SIZE * 0.26,
    SIZE * 0.04,
    SIZE * 0.46,
    SIZE * 0.46,
    SIZE * 0.76,
  );
  sphere.addColorStop(0, "rgba(255, 250, 238, 0.42)");
  sphere.addColorStop(0.28, "rgba(255, 246, 230, 0.14)");
  sphere.addColorStop(0.62, "rgba(0, 0, 0, 0)");
  sphere.addColorStop(0.88, "rgba(30, 16, 8, 0.34)");
  sphere.addColorStop(1, "rgba(24, 12, 6, 0.62)");
  bead.fillStyle = sphere;
  bead.fillRect(0, 0, SIZE, SIZE);

  // Sampled gloss drives the specular size and strength.
  const roughnessSample = document.createElement("canvas");
  roughnessSample.width = SIZE;
  roughnessSample.height = SIZE;
  const roughnessCtx = roughnessSample.getContext("2d")!;
  roughnessCtx.drawImage(
    roughness,
    (roughness.width - side) / 2,
    (roughness.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  const roughnessData = roughnessCtx.getImageData(0, 0, SIZE, SIZE).data;
  let total = 0;
  for (let i = 0; i < roughnessData.length; i += 4) total += roughnessData[i];
  const gloss = clamp01(1 - total / (roughnessData.length / 4) / 255);
  const [minRoughness, maxRoughness] = recipe.roughness;
  const polish = clamp01(
    1 - (minRoughness + maxRoughness) / 2 - (1 - gloss) * 0.15,
  );
  const specular = bead.createRadialGradient(
    SIZE * 0.33,
    SIZE * 0.28,
    0,
    SIZE * 0.33,
    SIZE * 0.28,
    lerp(SIZE * 0.62, SIZE * 0.2, polish),
  );
  specular.addColorStop(
    0,
    `rgba(255, 252, 244, ${lerp(0.16, 0.72, polish).toFixed(3)})`,
  );
  specular.addColorStop(0.45, "rgba(255, 250, 238, 0.06)");
  specular.addColorStop(1, "rgba(255, 250, 238, 0)");
  bead.fillStyle = specular;
  bead.fillRect(0, 0, SIZE, SIZE);

  // Contact shading at the lower edge, as if the bead rests in the tray.
  const contact = bead.createLinearGradient(0, SIZE * 0.72, 0, SIZE);
  contact.addColorStop(0, "rgba(30, 16, 8, 0)");
  contact.addColorStop(1, "rgba(30, 16, 8, 0.3)");
  bead.fillStyle = contact;
  bead.fillRect(0, 0, SIZE, SIZE);

  // A wide strip of the same material, for the suggested-combination beads.
  const stripCanvas = document.createElement("canvas");
  stripCanvas.width = SIZE;
  stripCanvas.height = SIZE;
  const strip = stripCanvas.getContext("2d")!;
  strip.drawImage(beadCanvas, 0, 0);
  // Two faint internal veils stand in for translucency.
  if (recipe.transmission > 0.2) {
    const veil = strip.createRadialGradient(
      SIZE * 0.68,
      SIZE * 0.62,
      SIZE * 0.04,
      SIZE * 0.68,
      SIZE * 0.62,
      SIZE * 0.55,
    );
    veil.addColorStop(0, `rgba(255, 236, 214, ${(recipe.transmission * 0.3).toFixed(3)})`);
    veil.addColorStop(1, "rgba(255, 236, 214, 0)");
    strip.fillStyle = veil;
    strip.fillRect(0, 0, SIZE, SIZE);
  }

  const preview: StonePreview = {
    bead: beadCanvas.toDataURL("image/webp", 0.9),
    strip: stripCanvas.toDataURL("image/webp", 0.9),
  };
  maps.dispose();
  cache.set(stoneKey, preview);
  return preview;
}

/**
 * Builds every preview off the critical path.
 *
 * Generation waits for the load event and a settled frame, so the previews can
 * never appear between server markup and hydration: the cards simply swap from
 * their flat gradient to the real material once the page is interactive.
 */
export function primeStonePreviews(
  stones: CustomStoneKey[],
  onReady: (previews: Record<string, StonePreview>) => void,
) {
  let cancelled = false;
  let idle = 0;
  let frame = 0;
  const generate = () => {
    if (cancelled) return;
    const previews: Record<string, StonePreview> = {};
    for (const stone of stones) previews[stone] = stonePreview(stone);
    onReady(previews);
  };
  const onIdle = () => {
    idle = 0;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(generate);
    });
  };
  const start = () => {
    if (cancelled) return;
    if (typeof requestIdleCallback === "function") idle = requestIdleCallback(onIdle);
    else onIdle();
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", start);
    cancelAnimationFrame(frame);
    if (idle) cancelIdleCallback(idle);
  };
}