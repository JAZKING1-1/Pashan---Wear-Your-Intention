import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Hand,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Square,
  Sun,
} from "lucide-react";
import type { BraceletBead } from "@/lib/bracelet-design";
import {
  createBraceletScene,
  type SceneLighting,
  type ScenePreset,
} from "@/lib/bracelet-scene/createBraceletScene";
import { braceletSvg } from "@/lib/bracelet-scene/illustration";
import { useAtelierCopy } from "@/data/atelier-copy";

// Three representative stone tones keep the little camera drawings reading as
// the same materials as the bracelet: tiger eye, hematite, amethyst.
const BEAD_TONES: [string, string, string][] = [
  ["#c08b42", "#6b4322", "#2a1a0f"],
  ["#8d949c", "#3c4148", "#15181c"],
  ["#a86fb8", "#6a3f86", "#2a1b34"],
];

/**
 * A small drawing of what each camera preset actually frames: the bracelet from
 * above, the reference's three-quarter angle, and a close pass. It gives the
 * preset buttons a recognisable shape without adding another render.
 */
function ViewAngleGlyph({ view }: { view: ScenePreset }) {
  const stops = (prefix: string) =>
    [0, 1, 2].map((i) => (
      <radialGradient key={i} id={`${prefix}-${i}`} cx="32%" cy="26%" r="72%">
        <stop offset="0" stopColor={BEAD_TONES[i][0]} />
        <stop offset=".55" stopColor={BEAD_TONES[i][1]} />
        <stop offset="1" stopColor={BEAD_TONES[i][2]} />
      </radialGradient>
    ));
  if (view === "detail")
    return (
      <svg className="atelier-view-glyph" viewBox="0 0 48 34" aria-hidden="true">
        <defs>{stops("glyph-detail")}</defs>
        <ellipse cx="24" cy="27" rx="20" ry="5" fill="#2b1a12" opacity=".16" />
        {[9, 22, 35, 45].map((x, i) => (
          <circle
            key={x}
            cx={x}
            cy={20 - i * 1.6}
            r={i === 3 ? 7 : 9}
            fill={`url(#glyph-detail-${i % 3})`}
          />
        ))}
      </svg>
    );
  const squash = view === "atelier" ? 1 : 0.42;
  const beads = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg className="atelier-view-glyph" viewBox="0 0 48 34" aria-hidden="true">
      <defs>{stops("glyph-ring")}</defs>
      <ellipse cx="24" cy="27" rx="18" ry="4.5" fill="#2b1a12" opacity=".16" />
      <ellipse
        cx="24"
        cy="17"
        rx="17"
        ry={17 * squash}
        fill="none"
        stroke="#8f6440"
        strokeWidth="1.3"
        opacity=".5"
      />
      {beads.map((i) => {
        const a = (i / beads.length) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={24 + Math.sin(a) * 17}
            cy={17 + Math.cos(a) * 17 * squash}
            r={i % 3 === 0 ? 4.6 : 4}
            fill={`url(#glyph-ring-${i % 3})`}
          />
        );
      })}
    </svg>
  );
}

export function BraceletScene3D({
  beads,
  selectedId = null,
  onSelect = () => {},
  initialView = "collection",
  focus = false,
  onFocusChange,
}: {
  beads: BraceletBead[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  initialView?: ScenePreset;
  focus?: boolean;
  onFocusChange?: (next: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<ReturnType<typeof createBraceletScene> | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<ScenePreset>(initialView);
  const [lighting, setLighting] = useState<SceneLighting>("natural");
  const [turning, setTurning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<
    "viewUpdated" | "viewStopped" | "turning" | null
  >(null);
  const reduced = useReducedMotion();
  const tourWasActive = useRef(false);
  const environment = useRef<HTMLDivElement>(null);
  // The room moves with the camera, but at a fraction of its speed: a damped
  // parallax of a few pixels, never a 1:1 lock to the bracelet.
  const parallax = useRef({ x: 0, y: 0, tx: 0, ty: 0, zoom: 1, raf: 0 });
  const coarse = useRef(false);
  const hintId = useId();
  const keyboardId = useId();
  const { a } = useAtelierCopy();
  const enabled = ready && !failed;
  useEffect(() => {
    const query = matchMedia("(pointer: coarse)");
    coarse.current = query.matches;
    const onChange = () => {
      coarse.current = query.matches;
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  const settleEnvironment = () => {
    const p = parallax.current;
    p.raf = 0;
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
      p.x = p.tx;
      p.y = p.ty;
    } else {
      p.x += dx * 0.12;
      p.y += dy * 0.12;
      p.raf = requestAnimationFrame(settleEnvironment);
    }
    if (!environment.current) return;
    const scale = 1 + (p.zoom - 1) * 0.05;
    environment.current.style.transform = `translate3d(${p.x.toFixed(
      2,
    )}px, ${p.y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
  };
  const aimEnvironment = (state: {
    azimuth: number;
    tilt: number;
    zoom: number;
  }) => {
    const p = parallax.current;
    // A coarse pointer or a reduced-motion visitor gets a still room.
    if (reduced || coarse.current) {
      p.tx = 0;
      p.ty = 0;
      p.zoom = 1;
    } else {
      const wrapped = Math.atan2(
        Math.sin(state.azimuth),
        Math.cos(state.azimuth),
      );
      p.tx = -wrapped * 9;
      p.ty = (state.tilt - 0.7) * 10;
      p.zoom = state.zoom;
    }
    if (!p.raf) p.raf = requestAnimationFrame(settleEnvironment);
  };
  useEffect(() => {
    if (!host.current) return;
    let runtime: ReturnType<typeof createBraceletScene> | null = null;
    try {
      runtime = createBraceletScene(
        host.current,
        (id) => select.current(id),
        () => setFailed(true),
        {
          onInteractionChange: (state) => {
            aimEnvironment(state);
            setTurning(state.touring);
            setDragging(state.rotating);
            if (tourWasActive.current && !state.touring)
              setNotice("viewUpdated");
            tourWasActive.current = state.touring;
          },
        },
      );
      api.current = runtime;
      setReady(true);
    } catch {
      setFailed(true);
    }
    return () => {
      cancelAnimationFrame(parallax.current.raf);
      runtime?.dispose();
      api.current = null;
    };
  }, []);
  useEffect(() => {
    api.current?.update(beads, selectedId);
  }, [beads, selectedId, ready]);
  useEffect(() => {
    api.current?.setView(view);
  }, [view, ready]);
  useEffect(() => {
    api.current?.setLighting(lighting);
  }, [lighting, ready]);
  useEffect(() => {
    api.current?.setFocus(focus);
  }, [focus, ready]);
  // Escape always leaves focus mode, from anywhere on the page.
  useEffect(() => {
    if (!focus) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onFocusChange?.(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, onFocusChange]);
  useEffect(() => {
    if (failed) {
      api.current?.dispose();
      api.current = null;
      setTurning(false);
      setDragging(false);
    }
  }, [failed]);
  const control = (action: () => void) => {
    if (!enabled) return;
    action();
    setNotice("viewUpdated");
  };
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!enabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => api.current?.turn(-Math.PI / 6),
      ArrowRight: () => api.current?.turn(Math.PI / 6),
      ArrowUp: () => api.current?.tilt(Math.PI / 18),
      ArrowDown: () => api.current?.tilt(-Math.PI / 18),
      "+": () => api.current?.zoom(1.15),
      "=": () => api.current?.zoom(1.15),
      "-": () => api.current?.zoom(1 / 1.15),
      Home: () => api.current?.reset(),
      Escape: () => api.current?.stopTour(),
    };
    if (actions[event.key]) {
      event.preventDefault();
      control(actions[event.key]);
    }
  };
  return (
    <div
      className="atelier-viewer"
      data-view={view}
      data-ready={enabled}
      data-touring={turning}
    >
      <div className="atelier-viewer-heading">
        <span>{a("explore360")}</span>
        <span className="atelier-360-mark" aria-hidden="true">
          360°
        </span>
      </div>
      <div
        className={"atelier-stage" + (dragging ? " is-dragging" : "")}
        role="group"
        tabIndex={enabled ? 0 : -1}
        aria-label={a("viewerLabel")}
        aria-describedby={`${hintId} ${keyboardId}`}
        onKeyDown={keys}
      >
        <div className="atelier-environment" aria-hidden="true">
          <div className="atelier-environment-drift" ref={environment} />
        </div>
        {/*
          The flat illustration is the no-WebGL fallback, not a second bracelet:
          it stays mounted only while the real scene is unavailable, so the two
          can never be visible at the same time.
        */}
        {!enabled && (
          <div
            className="atelier-flat"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: braceletSvg(beads, selectedId) }}
          />
        )}
        {!failed && <div className="atelier-canvas" ref={host} />}
        <div className="atelier-viewer-top">
          <div
            className="atelier-lighting"
            role="group"
            aria-label={a("studioLight")}
          >
            <span className="atelier-lighting-label">
              <Sun size={15} aria-hidden="true" />
              {a("studioLight")}
            </span>
            <div className="atelier-lighting-options">
              {(["natural", "atelier", "evening"] as const).map((mode, i) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={lighting === mode}
                  disabled={!enabled}
                  data-lighting={mode}
                  onClick={() => setLighting(mode)}
                >
                  <span
                    className="atelier-lighting-swatch"
                    data-lighting={mode}
                    aria-hidden="true"
                  />
                  {a(
                    (["lightNatural", "lightAtelier", "lightEvening"] as const)[i],
                  )}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="atelier-focus-toggle"
            aria-pressed={focus}
            disabled={!enabled}
            onClick={() => onFocusChange?.(!focus)}
          >
            <Maximize2 size={15} aria-hidden="true" />
            {focus ? a("exitFocus") : a("focusMode")}
          </button>
        </div>
        <div className="atelier-stage-caption" aria-hidden="true">
          {a("previewOnly")}
        </div>
        <p className="atelier-keyboard-help" id={keyboardId}>
          {a("keyboardHint")}
        </p>
      </div>
      {failed ? (
        <p className="atelier-viewer-help" id={hintId} role="status">
          {a("fallback")}
        </p>
      ) : (
        <p className="atelier-viewer-help" id={hintId}>
          <Hand size={18} aria-hidden="true" />
          <span>{enabled ? a("dragHint") : a("viewerLoading")}</span>
        </p>
      )}
      <div
        className="atelier-view-controls"
        role="group"
        aria-label={a("review")}
      >
        {(["atelier", "collection", "detail"] as const).map((v, i) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            disabled={!enabled}
            onClick={() => {
              api.current?.stopTour();
              setView(v);
              if (view === v) api.current?.setView(v);
              setNotice("viewUpdated");
            }}
          >
            <ViewAngleGlyph view={v} />
            {a((["overhead", "angled", "detail"] as const)[i])}
          </button>
        ))}
      </div>
      <div
        className="atelier-orbit-controls"
        role="group"
        aria-label={a("viewerLabel")}
      >
        <button
          type="button"
          disabled={!enabled}
          title={a("turnLeft")}
          aria-label={a("turnLeft")}
          onClick={() => control(() => api.current?.turn(-Math.PI / 6))}
        >
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <button
          type="button"
          disabled={!enabled}
          title={a("turnRight")}
          aria-label={a("turnRight")}
          onClick={() => control(() => api.current?.turn(Math.PI / 6))}
        >
          <ChevronRight aria-hidden="true" size={20} />
        </button>
        <button
          type="button"
          disabled={!enabled}
          title={a("tiltUp")}
          aria-label={a("tiltUp")}
          onClick={() => control(() => api.current?.tilt(Math.PI / 18))}
        >
          <ArrowUp aria-hidden="true" size={20} />
        </button>
        <button
          type="button"
          disabled={!enabled}
          title={a("tiltDown")}
          aria-label={a("tiltDown")}
          onClick={() => control(() => api.current?.tilt(-Math.PI / 18))}
        >
          <ArrowDown aria-hidden="true" size={20} />
        </button>
        <button
          type="button"
          disabled={!enabled}
          title={a("zoomOut")}
          aria-label={a("zoomOut")}
          onClick={() => control(() => api.current?.zoom(1 / 1.15))}
        >
          <Minus aria-hidden="true" size={20} />
        </button>
        <button
          type="button"
          disabled={!enabled}
          title={a("zoomIn")}
          aria-label={a("zoomIn")}
          onClick={() => control(() => api.current?.zoom(1.15))}
        >
          <Plus aria-hidden="true" size={20} />
        </button>
      </div>
      <div className="atelier-tour-controls">
        <button
          type="button"
          className="atelier-tour-button"
          disabled={!enabled || !!reduced}
          aria-pressed={turning}
          onClick={() => {
            if (turning) {
              api.current?.stopTour();
              setNotice("viewStopped");
            } else {
              api.current?.tour();
              setNotice("turning");
            }
          }}
        >
          {turning ? (
            <Square size={16} aria-hidden="true" />
          ) : (
            <RotateCw size={18} aria-hidden="true" />
          )}
          {a(turning ? "stopTurn" : "rotateOnce")}
        </button>
        <button
          type="button"
          disabled={!enabled}
          onClick={() => control(() => api.current?.reset())}
        >
          <RotateCcw size={16} aria-hidden="true" />
          {a("resetView")}
        </button>
      </div>
      {ready && reduced && (
        <p className="atelier-motion-note">{a("motionOff")}</p>
      )}
      <p className="sr-only" role="status" aria-atomic="true">
        {notice ? a(notice) : ""}
      </p>
    </div>
  );
}
