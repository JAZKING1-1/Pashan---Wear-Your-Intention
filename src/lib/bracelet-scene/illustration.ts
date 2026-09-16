import { PREVIEW_CAPACITY, type BraceletBead } from "@/lib/bracelet-design";
import { stonePalette } from "@/data/bracelet-assets";
export function beadLayout(beads: BraceletBead[]) {
  const slots = Math.max(PREVIEW_CAPACITY, beads.length);
  const r = 245;
  return beads.map((b, i) => ({
    ...b,
    x: 400 + Math.sin((i * 2 * Math.PI) / slots) * r,
    y: 400 - Math.cos((i * 2 * Math.PI) / slots) * r,
    angle: (i * 360) / slots,
    radius: Math.min(40, ((Math.PI * r) / slots) * 0.93),
  }));
}
export function braceletSvg(
  beads: BraceletBead[],
  selectedId: string | null = null,
) {
  const layout = beadLayout(beads);
  const defs = layout
    .map((b, i) => {
      const c = stonePalette[b.stoneKey];
      return `<radialGradient id="b${i}" cx="30%" cy="24%" r="78%"><stop stop-color="${c.light}"/><stop offset=".4" stop-color="${c.base}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient><clipPath id="c${i}"><circle r="${b.radius}"/></clipPath>`;
    })
    .join("");
  const beadsSvg = layout
    .map((b, i) => {
      const c = stonePalette[b.stoneKey];
      const bands =
        b.stoneKey === "tiger-eye"
          ? Array.from(
              { length: 7 },
              (_, j) =>
                `<path d="M ${-37 + j * 12} -50 Q ${-5 + j * 8 + (b.seed % 12)} 0 ${-45 + j * 13} 50" stroke="${j % 2 ? c.dark : c.light}" stroke-opacity=".48" stroke-width="${j % 2 ? 5 : 3}" fill="none"/>`,
            ).join("")
          : b.stoneKey === "lava"
            ? Array.from(
                { length: 16 },
                (_, j) =>
                  `<circle cx="${Math.sin(j * 7 + b.seed) * 29}" cy="${Math.cos(j * 4 + b.seed) * 29}" r="2.4" fill="#151413" opacity=".7"/>`,
              ).join("")
            : `<path d="M -30 5 Q -6 ${b.seed % 26} 31 -8" fill="none" stroke="${c.light}" opacity=".19" stroke-width="7"/>`;
      return `<g transform="translate(${b.x} ${b.y})"><ellipse cy="10" rx="${b.radius * 1.08}" ry="${b.radius}" fill="#32170f" opacity=".12"/><circle r="${b.radius}" fill="url(#b${i})"/><g clip-path="url(#c${i})" transform="rotate(${b.seed % 180})">${bands}</g><ellipse cx="-11" cy="-16" rx="11" ry="5" fill="#fff9f0" opacity=".52"/>${b.id === selectedId ? `<circle r="${b.radius + 8}" fill="none" stroke="#a3471c" stroke-width="5"/><text y="9" text-anchor="middle" fill="white" stroke="#32170f" stroke-width="1" font-size="27">✓</text>` : ""}</g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800"><defs>${defs}<radialGradient id="tray"><stop stop-color="#fffdf7"/><stop offset="1" stop-color="#eee0cc"/></radialGradient></defs><rect width="800" height="800" fill="#fff9f0"/><circle cx="400" cy="408" r="360" fill="#32170f" opacity=".07"/><circle cx="400" cy="400" r="356" fill="url(#tray)" stroke="#b48d52" stroke-width="3"/><circle cx="400" cy="400" r="346" fill="none" stroke="#e2cba5" stroke-width="2"/>${beads.length ? `<circle cx="400" cy="400" r="245" fill="none" stroke="#b77b4c" stroke-width="4"/>${beadsSvg}` : ""}</svg>`;
}
