import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { BotanicalSeal } from "./CraftOrnaments";
import "@/styles-ritual.css";

const SESSION_KEY = "pashan-portal-seen-v1";
// This is a decorative reveal inside the hero, never a page-blocking modal.
export function OpeningRitual({
  image,
  alt,
  srcSet,
  imageWidth = 960,
  imageHeight = 960,
  photoFit = "contain",
}: {
  image: string;
  alt: string;
  srcSet?: string;
  imageWidth?: number;
  imageHeight?: number;
  photoFit?: "contain" | "cover";
}) {
  const [playing, setPlaying] = useState(false);
  const [iteration, setIteration] = useState(0);
  const reduced = useReducedMotion();
  const [motionReady, setMotionReady] = useState(false);
  useEffect(() => setMotionReady(true), []);
  const arch = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const markSeen = () => {
    started.current = true;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* Storage is optional. */
    }
  };
  useEffect(() => {
    if (started.current) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* No storage required to shop. */
    }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    // Wait until the arch is visible on small screens. If observers fail or
    // are unavailable, the photograph stays open and the replay button works.
    if (!arch.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          !entries.some(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35,
          )
        )
          return;
        observer.disconnect();
        if (
          started.current ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        markSeen();
        setPlaying(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(arch.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (reduced) {
      setPlaying(false);
      return;
    }
    if (!playing) return;
    const timer = window.setTimeout(() => setPlaying(false), 1200);
    return () => window.clearTimeout(timer);
  }, [playing, iteration, reduced]);
  const replay = () => {
    markSeen();
    setIteration((value) => value + 1);
    setPlaying(!reduced);
  };
  return (
    <div
      className={"ritual-portal" + (playing ? " is-playing" : "")}
      data-testid="ritual-portal"
      lang="en"
      dir="ltr"
    >
      <div className="portal-crown" aria-hidden="true">
        <span />
        <BotanicalSeal />
        <span />
      </div>
      <div className="portal-arch" ref={arch}>
        <img
          src={image}
          srcSet={srcSet}
          sizes="(max-width: 700px) 330px, 460px"
          alt={alt}
          style={{ objectFit: photoFit }}
          width={imageWidth}
          height={imageHeight}
          fetchPriority="high"
          decoding="async"
        />
        <div className="portal-photo-caption">
          Natural stone · Your intention
        </div>
        {playing && (
          <div key={iteration} className="portal-doors" aria-hidden="true">
            <span className="portal-light" />
            <div className="portal-door portal-door-left">
              <BotanicalSeal />
              <i />
            </div>
            <div className="portal-door portal-door-right">
              <BotanicalSeal />
              <i />
            </div>
          </div>
        )}
      </div>
      <div className="portal-plinth" aria-hidden="true" />
      <button
        type="button"
        className="portal-control"
        disabled={motionReady && !!reduced}
        onClick={playing ? () => setPlaying(false) : replay}
      >
        {playing ? (
          <X size={14} aria-hidden="true" />
        ) : (
          <RotateCcw size={14} aria-hidden="true" />
        )}
        {motionReady && reduced
          ? "Entrance motion off"
          : playing
            ? "Skip entrance"
            : "Replay entrance"}
      </button>
      <span className="sr-only" role="status">
        {playing ? "Entrance animation playing." : "The atelier is open."}
      </span>
    </div>
  );
}
