import { PREVIEW_CAPACITY, type BraceletBead } from "@/lib/bracelet-design";
import { stonePalette } from "@/data/bracelet-assets";
import type { CustomStoneKey } from "@/data/products";

/**
 * The flat bracelet illustration used for the no-WebGL fallback, the mirror
 * preview, the suggested combinations and the exported design card.
 *
 * Two details matter here. When `materials` is supplied the beads are drawn
 * from the real procedural stone previews instead of hand-written gradients, so
 * a combination thumbnail shows the same material as the 3D bracelet; without
 * them the original gradient artwork is used unchanged, which keeps server
 * rendering and the export path dependency-free. And every element is written
 * with an explicit closing tag, because the HTML parser expands self-closing
 * SVG tags: a self-closed `<stop/>` is read back as `<stop></stop>`, so a
 * self-closing string would differ from the server markup during hydration.
 */
export type BraceletMaterials = Partial<Record<CustomStoneKey, string>>;

// Node and the browser can disagree on the last bit of a transcendental
// result, which would make these coordinates differ between the server string
// and the client render. Rounding keeps the layout identical on both sides.
const round = (value: number) => Math.round(value * 1000) / 1000;

export function beadLayout(beads: BraceletBead[]) {
  const slots = Math.max(PREVIEW_CAPACITY, beads.length);
  const r = 245;
  return beads.map((b, i) => ({
    ...b,
    x: round(400 + Math.sin((i * 2 * Math.PI) / slots) * r),
    y: round(400 - Math.cos((i * 2 * Math.PI) / slots) * r),
    angle: round((i * 360) / slots),
    radius: round(Math.min(40, ((Math.PI * r) / slots) * 0.93)),
  }));
}

export function braceletSvg(
  beads: BraceletBead[],
  selectedId: string | null = null,
  materials?: BraceletMaterials | null,
) {
  const layout = beadLayout(beads);
  const defs = layout
    .map((b, i) => {
      const c = stonePalette[b.stoneKey];
      return `<radialGradient id="b${i}" cx="30%" cy="24%" r="78%"><stop stop-color="${c.light}"></stop><stop offset=".4" stop-color="${c.base}"></stop><stop offset="1" stop-color="${c.dark}"></stop></radialGradient><clipPath id="c${i}"><circle r="${b.radius}"></circle></clipPath>`;
    })
    .join("");
  const beadsSvg = layout
    .map((b, i) => {
      const c = stonePalette[b.stoneKey];
      const material = materials?.[b.stoneKey];
      // Each bead keeps its own seed, so neighbouring beads of the same stone
      // sit at slightly different angles and never read as repeated stamps.
      const spin = b.seed % 180;
      const surface = material
        ? `<g clip-path="url(#c${i})"><g transform="rotate(${spin}) scale(1.28) translate(${(
            -400 +
            ((b.seed % 7) - 3) * 6
          ).toFixed(1)} ${(-400 + ((b.seed % 5) - 2) * 6).toFixed(1)})"><image href="${material}" x="-400" y="-400" width="800" height="800" preserveAspectRatio="xMidYMid slice"></image></g><ellipse cx="-11" cy="-16" rx="11" ry="5" fill="#fff9f0" opacity=".3"></ellipse></g>`
        : (() => {
            const bands =
              b.stoneKey === "tiger-eye"
                ? Array.from(
                    { length: 7 },
                    (_, j) =>
                      `<path d="M ${-37 + j * 12} -50 Q ${-5 + j * 8 + (b.seed % 12)} 0 ${-45 + j * 13} 50" stroke="${j % 2 ? c.dark : c.light}" stroke-opacity=".48" stroke-width="${j % 2 ? 5 : 3}" fill="none"></path>`,
                  ).join("")
                : b.stoneKey === "lava"
                  ? Array.from(
                      { length: 16 },
                      (_, j) =>
                        `<circle cx="${Math.sin(j * 7 + b.seed) * 29}" cy="${Math.cos(j * 4 + b.seed) * 29}" r="2.4" fill="#151413" opacity=".7"></circle>`,
                    ).join("")
                  : `<path d="M -30 5 Q -6 ${b.seed % 26} 31 -8" fill="none" stroke="${c.light}" opacity=".19" stroke-width="7"></path>`;
            return `<circle r="${b.radius}" fill="url(#b${i})"></circle><g clip-path="url(#c${i})" transform="rotate(${spin})">${bands}</g><ellipse cx="-11" cy="-16" rx="11" ry="5" fill="#fff9f0" opacity=".52"></ellipse>`;
          })();
      return `<g transform="translate(${b.x} ${b.y})"><ellipse cy="10" rx="${b.radius * 1.08}" ry="${b.radius}" fill="#32170f" opacity=".12"></ellipse>${surface}${b.id === selectedId ? `<circle r="${b.radius + 8}" fill="none" stroke="#a3471c" stroke-width="5"></circle><text y="9" text-anchor="middle" fill="white" stroke="#32170f" stroke-width="1" font-size="27">✓</text>` : ""}</g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800"><defs>${defs}<radialGradient id="tray"><stop stop-color="#fffdf7"></stop><stop offset="1" stop-color="#eee0cc"></stop></radialGradient></defs><rect width="800" height="800" fill="#fff9f0"></rect><circle cx="400" cy="408" r="360" fill="#32170f" opacity=".07"></circle><circle cx="400" cy="400" r="356" fill="url(#tray)" stroke="#b48d52" stroke-width="3"></circle><circle cx="400" cy="400" r="346" fill="none" stroke="#e2cba5" stroke-width="2"></circle>${beads.length ? `<circle cx="400" cy="400" r="245" fill="none" stroke="#b77b4c" stroke-width="4"></circle>${beadsSvg}` : ""}</svg>`;
}