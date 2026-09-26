import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Hand,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Square,
} from "lucide-react";
import type { BraceletBead } from "@/lib/bracelet-design";
import {
  createBraceletScene,
  type ScenePreset,
} from "@/lib/bracelet-scene/createBraceletScene";
import { braceletSvg } from "@/lib/bracelet-scene/illustration";
import { useAtelierCopy } from "@/data/atelier-copy";

export function BraceletScene3D({
  beads,
  selectedId = null,
  onSelect = () => {},
  initialView = "collection",
}: {
  beads: BraceletBead[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  initialView?: ScenePreset;
}) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<ReturnType<typeof createBraceletScene> | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<ScenePreset>(initialView);
  const [turning, setTurning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<
    "viewUpdated" | "viewStopped" | "turning" | null
  >(null);
  const reduced = useReducedMotion();
  const tourWasActive = useRef(false);
  const hintId = useId();
  const keyboardId = useId();
  const { a } = useAtelierCopy();
  const enabled = ready && !failed;
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
        <div
          className="atelier-flat"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: braceletSvg(beads, selectedId) }}
        />
        {!failed && <div className="atelier-canvas" ref={host} />}
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
