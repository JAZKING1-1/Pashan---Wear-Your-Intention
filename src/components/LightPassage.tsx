import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { Sun } from "lucide-react";

// Content is always visible. This finite light layer is decoration, not a gate.
export function LightPassage({ children }: { children: ReactNode }) {
  const surface = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!surface.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          setPlaying(true);
      },
      { threshold: 0.25 },
    );
    observer.observe(surface.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing) return;
    if (reduced) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setPlaying(false), 900);
    return () => window.clearTimeout(timer);
  }, [playing, replay, reduced]);
  return (
    <div className="light-passage">
      <div className="light-passage-surface" ref={surface}>
        {children}
        {playing && !reduced && (
          <span
            key={replay}
            className="light-passage-glow"
            aria-hidden="true"
          />
        )}
      </div>
      <button
        type="button"
        className="light-passage-control"
        disabled={mounted && !!reduced}
        onClick={() => {
          setReplay((value) => value + 1);
          setPlaying(!reduced);
        }}
      >
        <Sun aria-hidden="true" size={16} />
        {mounted && reduced ? "Light motion off" : "Replay light"}
      </button>
    </div>
  );
}
