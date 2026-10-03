import { useId } from "react";
import { stonePalette } from "@/data/bracelet-assets";
import type { BraceletBead } from "@/lib/bracelet-design";
import { beadLayout } from "@/lib/bracelet-scene/illustration";
import type { BraceletMaterials } from "@/lib/bracelet-scene/illustration";

/**
 * A small bracelet thumbnail for the suggested combinations and the mirror
 * preview.
 *
 * It is the same material system as the 3D bracelet: each bead draws the
 * procedural stone preview for its own stone, rotated and nudged by its own
 * seed, so a combination reads as miniature versions of the real beads rather
 * than a row of identical coloured dots. Without previews — during server
 * rendering — it falls back to the flat palette gradient.
 */
export function StoneBraceletPreview({
  beads,
  materials,
  className,
}: {
  beads: BraceletBead[];
  materials?: BraceletMaterials | null;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const layout = beadLayout(beads);
  if (!beads.length) return null;
  return (
    <svg
      className={className}
      viewBox="0 0 800 800"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {layout.map((b, i) => {
          const c = stonePalette[b.stoneKey];
          return (
            <radialGradient key={i} id={`${id}-g${i}`} cx="30%" cy="24%" r="78%">
              <stop offset="0" stopColor={c.light} />
              <stop offset=".4" stopColor={c.base} />
              <stop offset="1" stopColor={c.dark} />
            </radialGradient>
          );
        })}
        {layout.map((b, i) => (
          <clipPath key={i} id={`${id}-c${i}`}>
            <circle r={b.radius} />
          </clipPath>
        ))}
      </defs>
      <circle cx="400" cy="400" r="245" fill="none" stroke="#b77b4c" strokeWidth="4" />
      {layout.map((b, i) => {
        const material = materials?.[b.stoneKey];
        const spin = b.seed % 180;
        return (
          <g key={b.id + i} transform={`translate(${b.x} ${b.y})`}>
            <ellipse
              cy="10"
              rx={b.radius * 1.08}
              ry={b.radius}
              fill="#32170f"
              opacity=".12"
            />
            {material ? (
              <g clipPath={`url(#${id}-c${i})`}>
                <g
                  transform={`rotate(${spin}) scale(1.3) translate(${(-400 + ((b.seed % 7) - 3) * 6).toFixed(1)} ${(-400 + ((b.seed % 5) - 2) * 6).toFixed(1)})`}
                >
                  <image
                    href={material}
                    x="-400"
                    y="-400"
                    width="800"
                    height="800"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
                <ellipse
                  cx="-11"
                  cy="-16"
                  rx="11"
                  ry="5"
                  fill="#fff9f0"
                  opacity=".3"
                />
              </g>
            ) : (
              <>
                <circle r={b.radius} fill={`url(#${id}-g${i})`} />
                <ellipse
                  cx="-11"
                  cy="-16"
                  rx="11"
                  ry="5"
                  fill="#fff9f0"
                  opacity=".52"
                />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}