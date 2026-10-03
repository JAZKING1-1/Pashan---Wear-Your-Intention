import { Link } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { HeroSectionIndicator } from "./HeroSectionIndicator";
import type { HeroIndicatorSection } from "./HeroSectionIndicator";
import "@/styles-hero.css";

const SECTIONS: HeroIndicatorSection[] = [
  { id: "pashan-hero", label: "Introduction" },
  { id: "pashan-collections", label: "Featured collections" },
  { id: "pashan-shop", label: "Bracelets" },
  { id: "pashan-create", label: "Make your own" },
  { id: "pashan-stones", label: "Find your stone" },
];

const EASE_REVEAL = [0.22, 0.61, 0.36, 1] as const;

export function HeroRedesign() {
  const prefersReducedMotion = useReducedMotion();
  const { t } = useI18n();
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Gentle scroll parallax; disabled entirely for reduced motion.
  const yMedia = useTransform(scrollYProgress, [0, 1], ["0%", "7%"]);

  const scrollToSection = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  // ---- Intro choreography (total ≈ 3.5s) -------------------------------
  const rise = (delay: number) =>
    prefersReducedMotion
      ? ({ initial: { opacity: 1, y: 0 } } as const)
      : ({
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE_REVEAL },
        } as const);

  const lineReveal = (delay: number) =>
    prefersReducedMotion
      ? ({ initial: { y: "0%" } } as const)
      : ({
          initial: { y: "108%" },
          animate: { y: "0%" },
          transition: { duration: 1, delay, ease: EASE_REVEAL },
        } as const);

  const settle = (delay: number) =>
    prefersReducedMotion
      ? ({ initial: { opacity: 1 } } as const)
      : ({
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 1.1, delay, ease: "easeOut" },
        } as const);

  return (
    <section
      ref={heroRef}
      id="pashan-hero"
      className="pashan-hero-redesign"
      aria-label="PASHAN — Wear Your Intention"
    >
      {/* 1 — Photography: appears softly, settles, then parallax on scroll */}
      <motion.div
        className="hero-media"
        initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                opacity: { duration: 1.5, ease: "easeOut" },
                scale: { duration: 2.6, ease: "easeOut" },
              }
        }
        style={{ y: prefersReducedMotion ? 0 : yMedia }}
        aria-hidden="true"
      >
        <img
          src="/images/hero/hero-background.png"
          alt=""
          className="hero-media-img"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-light-pass" aria-hidden="true" />
      </motion.div>

      {/* 2 — Cinematic tonal blend: warm ivory → transitional tone → photo */}
      <div className="hero-scrim" aria-hidden="true" />

      {/* 3 — Copy */}
      <div className="hero-content">
        <motion.p className="hero-eyebrow" {...rise(0.9)}>
          NATURAL STONES · MEANINGFUL RITUALS · HARIDWAR
        </motion.p>

        <h1 className="hero-headline">
          <span className="hero-line">
            <motion.span {...lineReveal(1.05)}>WEAR YOUR</motion.span>
          </span>
          <span className="hero-line">
            <motion.span {...lineReveal(1.2)}>INTENTION.</motion.span>
          </span>
        </h1>

        <motion.p className="hero-secondary" {...rise(1.5)}>
          {t("headline")}
        </motion.p>

        <motion.p className="hero-body" {...rise(1.65)}>
          Natural stone bracelets made to be a daily reminder of what you
          choose to embody.
        </motion.p>

        <motion.div className="hero-actions" {...rise(1.85)}>
          <Link to="/find-your-bracelet" className="hero-btn hero-btn-solid">
            Find your bracelet <span aria-hidden="true">→</span>
          </Link>
          <Link to="/collections" className="hero-btn hero-btn-outline">
            Shop collections <span aria-hidden="true">→</span>
          </Link>
        </motion.div>

        <motion.div className="hero-ritual-kit" {...rise(2.05)}>
          <img
            src="/images/ritual-kit/pashan-box-480.webp"
            alt="PASHAN ritual kit"
            className="hero-kit-photo"
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
          />
          <span className="hero-kit-divider" aria-hidden="true" />
          <Gift className="hero-kit-icon" size={20} aria-hidden="true" />
          <p className="hero-kit-text">
            A complimentary PASHAN Ritual Kit
            <br />
            with every bracelet.
          </p>
        </motion.div>
      </div>

      {/* 4 — Collection caption, bottom right */}
      <motion.div {...settle(2.45)} className="hero-caption-anchor">
        <Link
          to="/collections/$slug"
          params={{ slug: "tiger-eye" }}
          className="hero-collection-caption"
        >
          The
          <br />
          Leadership
          <br />
          Collection
        </Link>
      </motion.div>

      {/* 5 — Right-side 01–05 navigation */}
      <motion.div {...settle(2.3)} className="hero-indicator-anchor">
        <HeroSectionIndicator sections={SECTIONS} onNavigate={scrollToSection} />
      </motion.div>

      {/* 6 — Scroll cue */}
      <motion.div {...settle(2.6)} className="hero-scroll-cue-anchor">
        <button
          type="button"
          className="hero-scroll-cue"
          onClick={() => scrollToSection("pashan-collections")}
          aria-label="Scroll to explore — featured collections"
        >
          <span className="hero-cue-mouse" aria-hidden="true">
            <span className="hero-cue-dot" />
          </span>
          <span className="hero-cue-label">Scroll to explore</span>
          <span className="hero-cue-rule" aria-hidden="true" />
        </button>
      </motion.div>
    </section>
  );
}
