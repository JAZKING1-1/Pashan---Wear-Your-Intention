import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import "@/styles-rashi-door.css";

/**
 * Framer's useReducedMotion samples the preference once and never re-reads it,
 * so a mid-session change (and the first client render after SSR) can leave the
 * entrance animating for someone who asked for less motion. This subscribes
 * directly instead.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

// Each leaf turns about its own outer stile, so the swing is a hinge rotation
// rather than a slide. 2.0s, with a ~1.2 degree settle: acceleration out of the
// seam, long deceleration, and just enough overshoot to feel like weight.
//
// 72 degrees, not 90: past that the leaves swing clear of the opening and stop
// reading as the door of this particular doorway. Held short, their inner faces
// and stiles stay on screen in front of the room.
const DOOR_SECONDS = 2;
const OPEN_DEG = 72;
const SETTLE_DEG = 73.2;
// Accelerate, decelerate, settle, rest.
const TIMES = [0, 0.58, 0.88, 1];
const KEYFRAMES: Record<"left" | "right", number[]> = {
  left: [0, -OPEN_DEG * 0.94, -SETTLE_DEG, -OPEN_DEG],
  right: [0, OPEN_DEG * 0.94, SETTLE_DEG, OPEN_DEG],
};

// Once per browser tab: the entrance plays on arrival, and only on an explicit
// replay after that, so navigating back to /rashi is never repetitive.
const SESSION_KEY = "pashan-rashi-door-seen-v3";

const HERO = "/images/rashi-hero/";
const DOOR = "/images/rashi-door/";
const doorSrcSet = (side: "left" | "right") =>
  [480, 768, 1024]
    .map((w) => `${DOOR}door-${side}-${w}.webp ${w}w`)
    .join(", ");

export function RashiDoorway() {
  const prefersReduced = usePrefersReducedMotion();

  const [opened, setOpened] = useState(false);
  const [motionKnown, setMotionKnown] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (prefersReduced) {
      setOpened(true);
      setMotionKnown(true);
      return;
    }
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* Storage is optional; the reveal still works. */
    }
    if (seen) {
      setMotionKnown(true);
      setOpened(true);
      return;
    }
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* No storage is required to see the entrance. */
    }
    // Hold the sealed state briefly so the shut doors register before moving.
    const timer = window.setTimeout(() => {
      setMotionKnown(true);
      setOpened(true);
    }, 380);
    return () => window.clearTimeout(timer);
  }, [prefersReduced]);

  const replay = useCallback(() => {
    if (prefersReduced) return;
    setOpened(false);
    // Remount the leaves so they start sealed again, then release them.
    setRun((value) => value + 1);
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => setOpened(true)),
    );
  }, [prefersReduced]);

  const d = prefersReduced ? 0 : DOOR_SECONDS;
  const t = prefersReduced ? [0] : TIMES;

  return (
    <figure className="rashi-doorway" data-testid="rashi-doorway">
      {/* The cover plane. Its box is exactly the rectangle the environment
          photograph occupies at `cover`, so every percentage below is that same
          fraction of the artwork. That is what lets the doors and the bracelet
          land on the painted architecture instead of merely near it. */}
      <div
        className="rashi-doorway-media"
        data-door-state={opened ? "open" : "closed"}
        data-motion-ready={motionKnown ? "true" : "false"}
      >
        {/* 1 — the room. Everything else happens in front of it. */}
        <img
          className="rashi-doorway-room"
          src={HERO + "environment-1400.webp"}
          srcSet={[900, 1400, 2000]
            .map((w) => `${HERO}environment-${w}.webp ${w}w`)
            .join(", ")}
          sizes="100vw"
          width={2000}
          height={1126}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
        />

        {/* 2 — the alcove. The bracelet is masked to the archway that is
            already painted into the room, so it reads as depth rather than as a
            picture hung on the back wall. */}
        <div className="rashi-doorway-alcove">
          <img
            className="rashi-doorway-scene"
            src={DOOR + "rashi-bracelet-720.webp"}
            srcSet={[480, 720, 960, 1448]
              .map((w) => `${DOOR}rashi-bracelet-${w}.webp ${w}w`)
              .join(", ")}
            sizes="(max-width: 700px) 22vw, 300px"
            width={1448}
            height={1086}
            alt="A single PASHAN Rashi bracelet, resting in the warm light of the alcove behind the doorway."
            decoding="async"
          />
          {/* Warm haze between the camera and the scene, then the grade that
              ties the photograph to the room's own light. */}
          <span className="rashi-doorway-alcove-haze" aria-hidden="true" />
          <span className="rashi-doorway-alcove-warm" aria-hidden="true" />
          <span className="rashi-doorway-alcove-vignette" aria-hidden="true" />
        </div>

        {/* 3 — warm light inside the room. Peaks as the leaves near 80% open,
            then settles to a steady level. */}
        <motion.div
          className="rashi-doorway-light"
          aria-hidden="true"
          initial={{ opacity: 0.22 }}
          animate={opened ? { opacity: [0.22, 0.52, 0.86, 0.5] } : { opacity: 0.22 }}
          transition={{ duration: d, times: t, ease: "easeInOut" }}
        />

        {/* The room held down while the doors are shut, so the scene only reads
            as "there" once the way in exists. */}
        <motion.div
          className="rashi-doorway-veil"
          aria-hidden="true"
          initial={{ opacity: 0.92 }}
          animate={{ opacity: opened ? 0 : 0.92 }}
          transition={{ duration: prefersReduced ? 0 : 1.25, ease: "easeOut" }}
        />

        {/* 4 — the leaves. Alpha cut-outs, so what swings is the door itself
            and the arch stays visible above it. */}
        <div className="rashi-doorway-panels" key={run}>
          {(["left", "right"] as const).map((side) => (
            <motion.div
              key={side}
              className={"rashi-doorway-panel is-" + side}
              initial={{ rotateY: 0 }}
              animate={{
                // With motion off the leaf is placed straight at its resting
                // angle, so the sign still has to follow the leaf: the left one
                // turns away to the left (-72), the right one to the right.
                rotateY: opened
                  ? prefersReduced
                    ? side === "left"
                      ? -OPEN_DEG
                      : OPEN_DEG
                    : KEYFRAMES[side]
                  : 0,
              }}
              transition={{
                duration: d,
                // The right leaf follows a beat behind: ceremonial, not mechanical.
                delay: prefersReduced ? 0 : side === "left" ? 0.08 : 0.26,
                times: t,
                ease: [0.32, 0.02, 0.2, 1],
              }}
            >
              <img
                src={`${DOOR}door-${side}-768.webp`}
                srcSet={doorSrcSet(side)}
                sizes="(max-width: 700px) 26vw, (max-width: 1100px) 15vw, 260px"
                width={1024}
                height={1536}
                alt=""
                aria-hidden="true"
                decoding="async"
              />
              {/* The lit inner stile, and the thickness the leaf shows as it
                  turns away from the camera. */}
              <span className="rashi-doorway-stile" aria-hidden="true" />
              <motion.span
                className="rashi-doorway-sweep"
                aria-hidden="true"
                initial={{ opacity: 0, x: "-70%" }}
                animate={
                  opened
                    ? { opacity: [0, 0.4, 0], x: ["-60%", "60%"] }
                    : { opacity: 0, x: "-60%" }
                }
                transition={{
                  duration: prefersReduced ? 0 : 1.1,
                  delay: prefersReduced ? 0 : 0.4,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Contact shadow the leaves throw into the jamb as they clear it. */}
        <motion.div
          className="rashi-doorway-cast"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: opened ? 0.9 : 0 }}
          transition={{ duration: prefersReduced ? 0 : 1.4, ease: "easeOut" }}
        />

        {/* Light leaking through the shut seam. */}
        <motion.div
          className="rashi-doorway-seam"
          aria-hidden="true"
          initial={{ opacity: 0.8, scaleX: 1 }}
          animate={
            opened ? { opacity: 0, scaleX: 3.2 } : { opacity: 0.8, scaleX: 1 }
          }
          transition={{ duration: prefersReduced ? 0 : 1.1, ease: "easeInOut" }}
        />

        {/* 5 — foreground: the brass reveal, over everything. */}
        <span className="rashi-doorway-reveal" aria-hidden="true" />

        {/* Slow breathing warmth once the alcove is open. */}
        {opened && !prefersReduced && (
          <motion.div
            className="rashi-doorway-ambient"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.1, 0.26, 0.1] }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
              delay: DOOR_SECONDS + 0.4,
            }}
          />
        )}

        {/* Editorial, and positioned against the plane so it always lands
            under the doorway rather than at some fixed offset from the hero. */}
        <button
          type="button"
          className="rashi-doorway-replay"
          onClick={replay}
          disabled={prefersReduced || !motionKnown}
          data-motion-off={prefersReduced}
        >
          <RotateCcw size={12} aria-hidden="true" />
          <span className="rashi-doorway-replay-label">
            <span className="is-idle">Replay entrance</span>
            <span className="is-reduced">Entrance motion off</span>
          </span>
        </button>
      </div>

      {/* Without scripting the leaves never part, so the photograph is shown. */}
      <noscript>
        <style>{`.rashi-doorway-panels,.rashi-doorway-seam,.rashi-doorway-veil{display:none!important}`}</style>
      </noscript>

      <span className="sr-only" role="status">
        {opened ? "The doorway is open." : "The doorway is opening."}
      </span>
    </figure>
  );
}