import { useEffect, useRef, useState } from "react";
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
  initialView = "atelier",
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
  const { a } = useAtelierCopy();
  useEffect(() => {
    if (!host.current) return;
    let runtime: ReturnType<typeof createBraceletScene> | null = null;
    try {
      runtime = createBraceletScene(
        host.current,
        (id) => select.current(id),
        () => setFailed(true),
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
    }
  }, [failed]);
  return (
    <div className="atelier-viewer" data-view={view}>
      <div className="atelier-stage">
        <div
          className="atelier-flat"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: braceletSvg(beads, selectedId) }}
        />
        {!failed && <div className="atelier-canvas" ref={host} />}
      </div>
      {failed && <p role="status">{a("fallback")}</p>}
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
            disabled={failed}
            onClick={() => setView(v)}
          >
            {a((["overhead", "angled", "detail"] as const)[i])}
          </button>
        ))}
        <button
          type="button"
          disabled={failed}
          onClick={() => api.current?.turn(-Math.PI / 6)}
        >
          {a("turnLeft")}
        </button>
        <button
          type="button"
          disabled={failed}
          onClick={() => api.current?.turn(Math.PI / 6)}
        >
          {a("turnRight")}
        </button>
        <button
          type="button"
          disabled={failed}
          onClick={() => api.current?.reset()}
        >
          {a("resetView")}
        </button>
      </div>
    </div>
  );
}
