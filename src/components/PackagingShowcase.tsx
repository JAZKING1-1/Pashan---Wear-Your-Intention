import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Gift, MoveUpRight } from "lucide-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ritualKit } from "@/data/ritual-kit";
import { LeafDivider } from "./CraftOrnaments";
import "@/styles-ritual-kit.css";

// Photographs produced by scripts/prepare-ritual-section-assets.mjs from the
// approved originals in design-references/. Resize and re-encode only.
const PHOTO = "/images/ritual-kit/pashan-box-1024.webp";
const PHOTO_SET = [640, 1024, 1536]
  .map((width) => `/images/ritual-kit/pashan-box-${width}.webp ${width}w`)
  .join(", ");
const PHOTO_FULL = "/images/ritual-kit/pashan-box-1536.webp";
const ENVIRONMENT = "/images/ritual-kit/ritual-environment-1400.webp";
const ENVIRONMENT_SET = [900, 1400, 1672]
  .map((width) => `/images/ritual-kit/ritual-environment-${width}.webp ${width}w`)
  .join(", ");

const VIEWS = [
  {
    label: "The presentation",
    caption: "An open PASHAN box, photographed with a Rose Quartz bracelet.",
    className: "is-presentation",
  },
  {
    label: "Ritual details",
    caption:
      "A closer look at the Ganga Jal, dhoop and printed PASHAN note in the same box.",
    className: "is-detail",
  },
] as const;

// These are documented objects visible in the selected original photograph,
// not a promise that every seasonal presentation has identical extras.
const DETAILS = [
  {
    title: "Ganga Jal",
    description: "A small bottle, tucked beside your piece.",
  },
  {
    title: "Dhoop",
    description: "A traditional accompaniment to a moment of pause.",
  },
  {
    title: "A PASHAN note",
    description: "A little welcome to carry with your intention.",
  },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export function PackagingShowcase() {
  const reduced = useReducedMotion();
  const [view, setView] = useState(0);
  const [activeDetail, setActiveDetail] = useState<number | null>(null);
  const [finePointer, setFinePointer] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // Depth: the environment drifts a little, the product a little differently.
  const environmentY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);
  const visualY = useTransform(scrollYProgress, [0, 1], ["2.5%", "-2.5%"]);

  // Pointer parallax stays inside a few pixels and only on fine pointers.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const softX = useSpring(pointerX, { stiffness: 55, damping: 22, mass: 0.6 });
  const softY = useSpring(pointerY, { stiffness: 55, damping: 22, mass: 0.6 });

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFinePointer(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    // A cached/early SSR image can fail before React attaches onError.
    const image = imageRef.current;
    if (image?.complete && image.currentSrc && !image.naturalWidth)
      setImageFailed(true);
  }, []);

  const active = VIEWS[view];
  // Reduced motion: the settled state is applied on mount, so nothing can be
  // left hidden if an observer never fires.
  const reveal = (delay: number, distance = 18) =>
    reduced
      ? ({ initial: { opacity: 1, y: 0 }, transition: { duration: 0 } } as const)
      : ({
          initial: { opacity: 0, y: distance },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease: EASE },
          viewport: { once: true, amount: 0.25 },
        } as const);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!finePointer || reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 12);
    pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * 8);
  };
  const onPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section
      ref={sectionRef}
      id="ritual-kit"
      className="ritual-kit section-space"
      aria-labelledby="ritual-kit-title"
      tabIndex={-1}
      lang="en"
      dir="ltr"
    >
      {/* Atmosphere: the photographed environment, then a light veil for text */}
      <motion.img
        className="ritual-kit-environment"
        src={ENVIRONMENT}
        srcSet={ENVIRONMENT_SET}
        sizes="100vw"
        width={1672}
        height={941}
        loading="lazy"
        decoding="async"
        alt=""
        aria-hidden="true"
        style={reduced ? undefined : { y: environmentY }}
        initial={
          reduced
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 1.03 }
        }
        whileInView={{ opacity: 1, scale: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 1.6, ease: "easeOut" }
        }
        viewport={{ once: true, amount: 0.15 }}
      />
      <div className="ritual-kit-veil" aria-hidden="true" />
      <div className="ritual-kit-light" aria-hidden="true" />

      <div className="container-luxe ritual-kit-layout">
        <header className="ritual-kit-intro">
          <motion.p
            className="ritual-kit-eyebrow"
            {...reveal(0.15, 12)}
          >
            <Gift size={18} aria-hidden="true" /> Our gift to you
          </motion.p>
          <motion.h2 id="ritual-kit-title" {...reveal(0.25)}>
            <span className="ritual-kit-line">
              <motion.span {...reveal(0.28)}>Not just a piece.</motion.span>
            </span>
            <span className="ritual-kit-line">
              <motion.span {...reveal(0.38)}>A ritual, included.</motion.span>
            </span>
          </motion.h2>
          <motion.p className="ritual-kit-promise" {...reveal(0.5, 12)}>
            {ritualKit.headline}
          </motion.p>
          <motion.p className="ritual-kit-description" {...reveal(0.6, 12)}>
            Choose something meaningful. Let the unboxing become a moment of its
            own — to pause, set an intention and begin wearing your piece.
          </motion.p>
        </header>

        <motion.div
          className="ritual-kit-visual"
          style={reduced ? undefined : { y: visualY }}
        >
          <motion.div
            className="ritual-kit-visual-reveal"
            initial={
              reduced
                ? { opacity: 1, y: 0, scale: 1 }
                : { opacity: 0, y: 26, scale: 1.03 }
            }
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 1.1, delay: 0.1, ease: EASE }
            }
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div
              className="ritual-kit-visual-pointer"
              style={reduced ? undefined : { x: softX, y: softY }}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
            >
              <figure
                className="ritual-kit-gallery"
                aria-label="PASHAN ritual kit photograph"
              >
                <div className={`ritual-kit-photo ${active.className}`}>
                  <div className="ritual-kit-photo-drift" aria-hidden="true">
                    {imageFailed ? (
                      <div className="ritual-kit-image-error" role="status">
                        <Gift size={32} aria-hidden="true" />
                        <p>
                          The kit photograph could not load. The details are
                          still available below.
                        </p>
                      </div>
                    ) : (
                      <img
                        ref={imageRef}
                        src={PHOTO}
                        srcSet={PHOTO_SET}
                        sizes="(max-width:700px) calc(100vw - 62px), (max-width:1000px) 46vw, 660px"
                        width={1536}
                        height={1024}
                        loading="lazy"
                        decoding="async"
                        alt="Actual open PASHAN box photographed among warm stones, holding a pink-stone bracelet, a labelled Ganga Jal bottle, a packet of dhoop and printed PASHAN cards."
                        onError={() => setImageFailed(true)}
                      />
                    )}
                  </div>
                  <span className="ritual-kit-photo-label">
                    The PASHAN unboxing
                  </span>
                </div>
                <div
                  className="ritual-kit-view-controls"
                  role="group"
                  aria-label="Choose a view of the ritual kit"
                >
                  {VIEWS.map((item, index) => (
                    <button
                      type="button"
                      key={item.label}
                      aria-pressed={view === index}
                      onClick={() => setView(index)}
                    >
                      <span aria-hidden="true">
                        {view === index ? (
                          <Check size={16} />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
                <figcaption>
                  <p aria-live="polite" aria-atomic="true">
                    {active.caption}
                  </p>
                  <a href={PHOTO_FULL} target="_blank" rel="noreferrer">
                    See the full photograph{" "}
                    <MoveUpRight size={14} aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </figcaption>
              </figure>
            </motion.div>
          </motion.div>
        </motion.div>

        <div className="ritual-kit-details">
          <motion.p className="ritual-kit-details-label" {...reveal(0.72, 10)}>
            Inside the photographed box
          </motion.p>
          <ol>
            {DETAILS.map((item, index) => (
              <motion.li
                key={item.title}
                className={activeDetail === index ? "is-active" : undefined}
                onPointerEnter={() => setActiveDetail(index)}
                onPointerLeave={() =>
                  setActiveDetail((current) =>
                    current === index ? null : current,
                  )
                }
                {...reveal(0.8 + index * 0.09, 14)}
              >
                <span className="ritual-kit-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          <motion.p className="ritual-kit-footnote" {...reveal(1.12, 10)}>
            Your kit accompanies the product you choose; seasonal packaging and
            additional extras may differ.
          </motion.p>
        </div>

        <div className="ritual-kit-actions">
          <motion.div {...reveal(1.24, 12)}>
            <Link
              to="/collections"
              className="ritual-button ritual-button-saffron"
            >
              Choose your piece <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </motion.div>
          <motion.span {...reveal(1.32, 10)}>{ritualKit.summary}</motion.span>
        </div>
      </div>
      <motion.div
        className="ritual-kit-divider"
        initial={
          reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }
        }
        whileInView={{ opacity: 1, scale: 1 }}
        transition={
          reduced ? { duration: 0 } : { duration: 0.9, delay: 0.1, ease: EASE }
        }
        viewport={{ once: true, amount: 0.6 }}
      >
        <LeafDivider />
      </motion.div>
    </section>
  );
}