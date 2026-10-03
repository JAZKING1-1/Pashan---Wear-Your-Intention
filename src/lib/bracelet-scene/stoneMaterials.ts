import * as THREE from "three";
import {
  stoneMaterials,
  stonePalette,
  type StoneMaterialRecipe,
} from "@/data/bracelet-assets";
import type { CustomStoneKey } from "@/data/products";

/**
 * Deterministic procedural stone materials for the atelier preview.
 *
 * Each stone gets a small family of generated maps (colour, roughness, relief)
 * built from its recipe, and each bead then receives a stable material derived
 * from its own seed: a little hue and value drift, a different gloss, a
 * different noise phase. Two beads of the same stone therefore never look
 * identical, and a bead looks the same on every render and every visit.
 *
 * These are rendering characteristics only. Nothing here describes a stone's
 * origin, treatment, effect or worth.
 */

const MAP_WIDTH = 256;
const MAP_HEIGHT = 128;

/** Small, fast, seedable generator. Same seed, same material, every time. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Smooth 2D value noise from a seeded gradient table. */
function makeNoise(seed: number) {
  const random = mulberry32(seed);
  const table = new Float32Array(256);
  for (let i = 0; i < table.length; i += 1) table[i] = random();
  const at = (x: number, y: number) => {
    const ix = ((x % 256) + 256) % 256;
    const iy = ((y % 256) + 256) % 256;
    return table[(ix + iy * 16) % 256];
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number, scale = 1) => {
    const fx = x * scale;
    const fy = y * scale;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = smooth(fx - x0);
    const ty = smooth(fy - y0);
    const a = lerp(at(x0, y0), at(x0 + 1, y0), tx);
    const b = lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), tx);
    return lerp(a, b, ty);
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const mixRgb = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

export type StoneTextures = {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  dispose: () => void;
};

/**
 * Paints the three maps for one stone family. `variant` selects a different
 * noise phase and banding offset, so a bracelet of 18 beads drawn from a
 * handful of families still reads as individually cut stones.
 */
export function createStoneTextures(
  stoneKey: CustomStoneKey,
  variant: number,
  anisotropy: number,
): StoneTextures {
  const recipe = stoneMaterials[stoneKey];
  const palette = stonePalette[stoneKey];
  const base = hexToRgb(palette.base);
  const light = hexToRgb(palette.light);
  const dark = hexToRgb(palette.dark);

  const colorCanvas = document.createElement("canvas");
  const roughCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  for (const canvas of [colorCanvas, roughCanvas, bumpCanvas]) {
    canvas.width = MAP_WIDTH;
    canvas.height = MAP_HEIGHT;
  }
  const colorCtx = colorCanvas.getContext("2d")!;
  const roughCtx = roughCanvas.getContext("2d")!;
  const bumpCtx = bumpCanvas.getContext("2d")!;
  const colorImage = colorCtx.createImageData(MAP_WIDTH, MAP_HEIGHT);
  const roughImage = roughCtx.createImageData(MAP_WIDTH, MAP_HEIGHT);
  const bumpImage = bumpCtx.createImageData(MAP_WIDTH, MAP_HEIGHT);

  const fine = makeNoise(1013 + variant * 977);
  const coarse = makeNoise(7919 + variant * 613);
  const grit = makeNoise(4409 + variant * 149);
  const phase = variant * 1.7;
  // Per-family pits keep lava porous and pyrite granular in a repeatable way.
  const random = mulberry32(3301 + variant * 397);
  const pits = Array.from({ length: stoneKey === "lava" ? 90 : 0 }, () => ({
    x: random() * MAP_WIDTH,
    y: random() * MAP_HEIGHT,
    r: 2 + random() * 6,
    depth: 0.4 + random() * 0.6,
  }));

  const write = (image: ImageData, index: number, rgb: number[], a = 255) => {
    image.data[index] = clamp01(rgb[0] / 255) * 255;
    image.data[index + 1] = clamp01(rgb[1] / 255) * 255;
    image.data[index + 2] = clamp01(rgb[2] / 255) * 255;
    image.data[index + 3] = a;
  };

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const index = (y * MAP_WIDTH + x) * 4;
      const n = fine(x, y, 0.55);
      const c = coarse(x, y, 0.11);
      const g = grit(x, y, 1.4);

      let colour: [number, number, number];
      let roughness: number;
      let relief: number;

      switch (recipe.pattern) {
        // Chatoyant banding: golden bands run across the bead, glossy where
        // they catch the light and deeper brown between them.
        case "banded": {
          const band = Math.sin(x * 0.055 + y * 0.018 + phase);
          const sheenBand = Math.sin(x * 0.055 + y * 0.018 + phase + 1.2);
          const strength = clamp01(band * 0.5 + 0.5);
          colour = mixRgb(dark, light, Math.pow(strength, 1.35));
          colour = mixRgb(colour, base, 0.35 + c * 0.3);
          roughness = lerp(0.16, 0.42, 1 - clamp01(sheenBand * 0.5 + 0.5));
          roughness += (n - 0.5) * 0.08;
          relief = 0.5 + band * 0.35 + (g - 0.5) * 0.1;
          break;
        }
        // Metallic, faintly drawn streaks rather than a mirror.
        case "streaked": {
          const streak = coarse(x * 0.35, y, 0.3);
          colour = mixRgb(dark, base, 0.45 + c * 0.45);
          colour = mixRgb(colour, light, Math.pow(clamp01(streak), 3) * 0.55);
          roughness = lerp(0.12, 0.34, clamp01(streak * 0.7 + n * 0.3));
          relief = 0.5 + (n - 0.5) * 0.25;
          break;
        }
        // Crystalline granularity with brighter brassy flecks.
        case "granular": {
          const fleck = Math.pow(clamp01(g * 1.15 - 0.25), 3);
          colour = mixRgb(dark, base, 0.5 + c * 0.4);
          colour = mixRgb(colour, light, fleck);
          roughness = lerp(0.3, 0.62, clamp01(1 - g + n * 0.3));
          relief = 0.5 + (g - 0.5) * 0.9 + fleck * 0.25;
          break;
        }
        // Translucent cloudiness: soft internal tonal drift.
        case "clouded": {
          const cloud = c * 0.7 + n * 0.3;
          colour = mixRgb(base, light, Math.pow(clamp01(cloud), 1.4));
          colour = mixRgb(colour, dark, clamp01(0.55 - cloud) * 0.7);
          roughness = lerp(0.14, 0.34, clamp01(n * 0.6 + c * 0.4));
          relief = 0.5 + (n - 0.5) * 0.2;
          break;
        }
        // Dark, matte and visibly porous.
        default: {
          let pit = 0;
          for (const candidate of pits) {
            const distance = Math.hypot(x - candidate.x, y - candidate.y);
            if (distance < candidate.r)
              pit = Math.max(pit, candidate.depth * (1 - distance / candidate.r));
          }
          colour = mixRgb(dark, base, 0.35 + c * 0.45);
          colour = mixRgb(colour, light, Math.pow(clamp01(g), 4) * 0.35);
          colour = mixRgb(colour, [0, 0, 0], pit * 0.85);
          roughness = clamp01(0.86 + (g - 0.5) * 0.14 + pit * 0.08);
          relief = 0.5 - pit * 0.7 + (g - 0.5) * 0.35;
          break;
        }
      }

      write(colorImage, index, colour);
      write(
        roughImage,
        index,
        [clamp01(roughness) * 255, clamp01(roughness) * 255, clamp01(roughness) * 255],
      );
      write(
        bumpImage,
        index,
        [clamp01(relief) * 255, clamp01(relief) * 255, clamp01(relief) * 255],
      );
    }
  }

  colorCtx.putImageData(colorImage, 0, 0);
  roughCtx.putImageData(roughImage, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = anisotropy;
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = anisotropy;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = anisotropy;
  for (const texture of [map, roughnessMap, bumpMap]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }

  return {
    map,
    roughnessMap,
    bumpMap,
    dispose: () => {
      map.dispose();
      roughnessMap.dispose();
      bumpMap.dispose();
    },
  };
}

/**
 * Builds one bead's material from its stone recipe and its stable seed.
 * The maps are shared per stone family; only the per-bead scalars differ.
 */
export function createStoneMaterial(
  stoneKey: CustomStoneKey,
  seed: number,
  textures: StoneTextures,
): THREE.MeshPhysicalMaterial {
  const recipe: StoneMaterialRecipe = stoneMaterials[stoneKey];
  const random = mulberry32(seed);
  const [minRoughness, maxRoughness] = recipe.roughness;
  const [minMetalness, maxMetalness] = recipe.metalness;
  const roughness = lerp(minRoughness, maxRoughness, random());
  const metalness = lerp(minMetalness, maxMetalness, random());
  const variation = recipe.variation;
  // Tiny, stable drift in value and warmth so neighbours never match.
  const lightness = 1 + (random() - 0.5) * variation * 2;
  const warmth = 1 + (random() - 0.5) * variation * 0.7;

  const material = new THREE.MeshPhysicalMaterial({
    map: textures.map,
    roughnessMap: textures.roughnessMap,
    bumpMap: textures.bumpMap,
    bumpScale: recipe.relief * 0.012,
    color: new THREE.Color(lightness, warmth, lightness),
    roughness,
    metalness,
    sheen: recipe.sheen,
    sheenRoughness: Math.min(1, roughness + 0.35),
    sheenColor: new THREE.Color("#ffe6c2"),
    clearcoat: stoneKey === "lava" ? 0 : 0.18,
    clearcoatRoughness: Math.min(1, roughness + 0.2),
    transmission: recipe.transmission,
    thickness: recipe.thickness,
    ior: 1.54,
    envMapIntensity: 0.9 + random() * 0.3,
  });
  // Textures belong to the shared cache, never to a single bead's material.
  material.userData.sharedTextures = true;
  return material;
}