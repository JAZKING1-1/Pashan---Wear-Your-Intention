import { useEffect, useRef, useState, type CSSProperties } from "react";
import { RotateCcw, X } from "lucide-react";
import { BotanicalSeal } from "./CraftOrnaments";
import { CataloguePhoto } from "./CataloguePhoto";
import "@/styles-ritual.css";

const SESSION_KEY = "pashan-portal-seen-v2";
export const PORTAL_DURATION_MS = 2400;
// Only browser effects/events add to this set. SSR never marks another visitor
// as seen, and denied sessionStorage still preserves the choice across routes.
const seenWindows = new WeakSet<Window>();
// This is a decorative reveal inside the hero, never a page-blocking modal.
export function OpeningRitual({
  image,
  alt,
  srcSet,
  imageWidth = 960,
  imageHeight = 960,
  photoFit = "contain",
  productSlug,
  variant = "classic",
}: {
  image: string;
  alt: string;
  srcSet?: string;
  imageWidth?: number;
  imageHeight?: number;
  photoFit?: "contain" | "cover";
  productSlug?: string;
  variant?: "classic" | "atelier";
}) {
  const [playing, setPlaying] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const arch = useRef<HTMLDivElement>(null);
  const actions = useRef<{ replay: () => void; skip: () => void } | null>(null);
  useEffect(() => {
    const node = arch.current;
    if (!node) return;
    let disposed = false;
    let active = false;
    let timer: number | null = null;
    let reducedNow = true;
    let observerAvailable = false;
    let observedRatio = 0;
    let observer: IntersectionObserver | null = null;
    let dialogs: MutationObserver | null = null;
    let media: MediaQueryList | null = null;
    let seen = seenWindows.has(window);
    // Keep hydration and Strict Mode's setup/cleanup cycle open by default.
    setPlaying(false);
    try {
      seen ||= window.sessionStorage.getItem(SESSION_KEY) === "1";
      if (seen) seenWindows.add(window);
    } catch {
      /* No storage is required to shop or dismiss the entrance. */
    }

    function markSeen() {
      seen = true;
      seenWindows.add(window);
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* The window-scoped memory above is the storage-denied fallback. */
      }
    }

    function finish() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      if (active) {
        active = false;
        if (!disposed) setPlaying(false);
      }
    }

    function visibleRatio() {
      const rect = node!.getBoundingClientRect();
      if (!rect.width || !rect.height) return 0;
      const width = Math.max(
        0,
        Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0),
      );
      const height = Math.max(
        0,
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0),
      );
      return (width * height) / (rect.width * rect.height);
    }

    function dialogOpen() {
      return Array.from(
        document.querySelectorAll<HTMLElement>(
          'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]',
        ),
      ).some((dialog) => {
        if (
          dialog.getAttribute("data-state") === "closed" ||
          dialog.hidden ||
          dialog.closest('[aria-hidden="true"]') ||
          !dialog.getClientRects().length
        )
          return false;
        const style = window.getComputedStyle(dialog);
        return style.display !== "none" && style.visibility !== "hidden";
      });
    }

    function start(manual: boolean) {
      if (
        disposed ||
        reducedNow ||
        document.hidden ||
        dialogOpen() ||
        !visibleRatio()
      )
        return;
      if (
        !manual &&
        (!observerAvailable ||
          observedRatio < 0.35 ||
          visibleRatio() < 0.35 ||
          seen ||
          seenWindows.has(window))
      )
        return;
      finish();
      markSeen();
      active = true;
      setIteration((value) => value + 1);
      setPlaying(true);
      // CSS is decorative, never the source of completion. This finite fallback
      // also opens the photograph when animation events or styles are missing.
      timer = window.setTimeout(finish, PORTAL_DURATION_MS);
    }

    function synchronize() {
      if (disposed) return;
      // Ignore unrelated page mutations after the once-per-tab reveal, unless
      // the visitor explicitly replays it. Idle ornament needs no layout reads.
      if (
        !active &&
        (seen ||
          seenWindows.has(window) ||
          !observerAvailable ||
          observedRatio < 0.35)
      )
        return;
      if (reducedNow || document.hidden || dialogOpen() || !visibleRatio()) {
        finish();
        return;
      }
      if (!active) start(false);
    }

    function motionChange() {
      // If the preference cannot be read, fail open instead of assuming motion.
      reducedNow = media?.matches ?? true;
      setReduced(reducedNow);
      setMotionReady(true);
      synchronize();
    }

    actions.current = { replay: () => start(true), skip: finish };
    try {
      media = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (media.addEventListener)
        media.addEventListener("change", motionChange);
      else media.addListener(motionChange);
    } catch {
      media = null;
    }
    motionChange();

    // Keep observing after the first reveal so scrolling offscreen can cancel a
    // replay too. Missing/throwing observers leave the SSR photograph visible.
    if (typeof IntersectionObserver !== "undefined") {
      try {
        observer = new IntersectionObserver(
          (entries) => {
            if (disposed) return;
            const entry = entries.find((value) => value.target === node);
            if (!entry) return;
            observedRatio = entry.isIntersecting ? entry.intersectionRatio : 0;
            if (!observedRatio) finish();
            else synchronize();
          },
          { threshold: [0, 0.35] },
        );
        observer.observe(node);
        observerAvailable = true;
      } catch {
        try {
          observer?.disconnect();
        } catch {
          /* Optional observer failed. */
        }
        observer = null;
        observerAvailable = false;
        finish();
      }
    }

    // Radix portals live outside this component. Observe real visible dialogs,
    // never change their focus, inert state or body-scroll behavior ourselves.
    if (typeof MutationObserver !== "undefined") {
      try {
        dialogs = new MutationObserver(synchronize);
        dialogs.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: [
            "data-state",
            "aria-modal",
            "aria-hidden",
            "hidden",
            "open",
            "role",
            "class",
            "style",
          ],
        });
      } catch {
        dialogs?.disconnect();
        dialogs = null;
      }
    }
    const scroll = () => {
      if (active && !visibleRatio()) finish();
    };
    document.addEventListener("scroll", scroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", synchronize, { passive: true });
    document.addEventListener("visibilitychange", synchronize);
    return () => {
      disposed = true;
      finish();
      actions.current = null;
      try {
        observer?.disconnect();
      } catch {
        /* Optional observer failed. */
      }
      dialogs?.disconnect();
      if (media?.removeEventListener)
        media.removeEventListener("change", motionChange);
      else media?.removeListener(motionChange);
      document.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, []);

  const controlLabel =
    motionReady && reduced
      ? "Entrance motion off"
      : playing
        ? "Skip entrance"
        : "Replay entrance";
  return (
    <div
      className={
        "ritual-portal" +
        (variant === "atelier" ? " portal-atelier" : "") +
        (playing ? " is-playing" : "")
      }
      style={
        { "--portal-duration": `${PORTAL_DURATION_MS}ms` } as CSSProperties
      }
      data-testid="ritual-portal"
      data-portal-duration={PORTAL_DURATION_MS}
      lang="en"
      dir="ltr"
    >
      <div className="portal-crown" aria-hidden="true">
        <span />
        <BotanicalSeal />
        <span />
      </div>
      <div className="portal-arch" ref={arch}>
        {productSlug ? (
          <CataloguePhoto
            slug={productSlug}
            sizes="(max-width:700px) 88vw, 460px"
            priority
          />
        ) : (
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
        )}
        <div className="portal-photo-caption">
          Natural stone · Your intention
        </div>
        <div className="portal-arch-rings" aria-hidden="true">
          <span className="portal-arch-ring portal-arch-ring-outer" />
          <span className="portal-arch-ring portal-arch-ring-inner" />
        </div>
        {playing && (
          <div key={iteration} className="portal-doors" aria-hidden="true">
            <span className="portal-light">
              <span className="portal-light-seam" />
            </span>
            <span className="portal-threshold-light" />
            <div className="portal-door portal-door-left">
              <span className="portal-door-panel portal-door-panel-upper" />
              <span className="portal-door-panel portal-door-panel-lower" />
              <span className="portal-door-seal">
                <BotanicalSeal />
              </span>
              <i />
            </div>
            <div className="portal-door portal-door-right">
              <span className="portal-door-panel portal-door-panel-upper" />
              <span className="portal-door-panel portal-door-panel-lower" />
              <span className="portal-door-seal">
                <BotanicalSeal />
              </span>
              <i />
            </div>
          </div>
        )}
      </div>
      <div className="portal-plinth" aria-hidden="true" />
      <button
        type="button"
        className="portal-control"
        disabled={!motionReady || reduced}
        onClick={() =>
          playing ? actions.current?.skip() : actions.current?.replay()
        }
      >
        {playing ? (
          <X size={14} aria-hidden="true" />
        ) : (
          <RotateCcw size={14} aria-hidden="true" />
        )}
        <span className="portal-control-label">
          <span className="portal-control-reserve" aria-hidden="true">
            Entrance motion off
          </span>
          <span className="portal-control-text">{controlLabel}</span>
        </span>
      </button>
      <span className="sr-only" role="status">
        {playing ? "Entrance animation playing." : "The atelier is open."}
      </span>
    </div>
  );
}
