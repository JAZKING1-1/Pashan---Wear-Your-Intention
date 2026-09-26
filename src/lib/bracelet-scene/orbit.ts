export const ORBIT_LIMITS = {
  minTilt: 0.2,
  maxTilt: Math.PI / 2 - 0.001,
  minZoom: 0.65,
  maxZoom: 1.6,
} as const;

export type OrbitPose = {
  azimuth: number;
  tilt: number;
  zoom: number;
  distance: number;
  targetFactor: number;
};

export function clampOrbitTilt(value: number) {
  return Math.min(ORBIT_LIMITS.maxTilt, Math.max(ORBIT_LIMITS.minTilt, value));
}

export function clampOrbitZoom(value: number) {
  return Math.min(ORBIT_LIMITS.maxZoom, Math.max(ORBIT_LIMITS.minZoom, value));
}

export function wrapOrbitAzimuth(value: number) {
  const turn = Math.PI * 2;
  return ((((value + Math.PI) % turn) + turn) % turn) - Math.PI;
}

export function interpolateOrbit(
  from: OrbitPose,
  to: OrbitPose,
  progress: number,
): OrbitPose {
  const t = Math.max(0, Math.min(1, progress));
  // Deliberately interpolate the continuous angle, never wrap it: a requested
  // 360-degree tour must really travel a full turn instead of taking a shortcut.
  return {
    azimuth: from.azimuth + (to.azimuth - from.azimuth) * t,
    tilt: from.tilt + (to.tilt - from.tilt) * t,
    zoom: from.zoom + (to.zoom - from.zoom) * t,
    distance: from.distance + (to.distance - from.distance) * t,
    targetFactor: from.targetFactor + (to.targetFactor - from.targetFactor) * t,
  };
}

export function orbitPointerIntent(
  dx: number,
  dy: number,
  pointerType: string,
) {
  const touch = pointerType === "touch";
  if (Math.hypot(dx, dy) < (touch ? 9 : 6)) return "pending";
  // Once a touch begins vertically it belongs to the page, not the bracelet.
  if (touch && Math.abs(dy) >= Math.abs(dx)) return "scroll";
  return "rotate";
}
