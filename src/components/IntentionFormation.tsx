import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TargetAndTransition, Variants } from "framer-motion";
import { CataloguePhoto } from "./CataloguePhoto";
import "./IntentionFormation.css";

export function IntentionFormation({
  productSlug,
}: {
  productSlug: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [sequenceComplete, setSequenceComplete] = useState(prefersReducedMotion);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax / subtle movement state for after sequence completes
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Complete the initial timeline sequence
    const timer = setTimeout(() => {
      setSequenceComplete(true);
    }, 4500); // Sequence finishes around 4.5s

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!sequenceComplete || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      // Calculate relative position (-1 to 1)
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [sequenceComplete, prefersReducedMotion]);

  // Framer Motion Variants for the sequence

  // The single bead is faked by masking the center-top bead of the image initially,
  // then expanding the mask to reveal the whole bracelet.
  // Assuming the top bead is roughly at 50% x, 15% y for a circular layout.
  // A circular clip-path works perfectly for "formation" mapping from a bead to the full ring.
  const imageRevealVariants: Variants = {
    initial: {
      clipPath: "circle(0% at 50% 50%)",
      opacity: 0,
      scale: 0.95
    },
    singleBead: {
      // Reveal just one bead at the top roughly
      clipPath: "circle(5% at 50% 15%)",
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.5 }
    },
    formation: {
      // Expand mask to show the entire bracelet softly
      clipPath: "circle(70% at 50% 50%)",
      opacity: 1,
      scale: 1,
      transition: { duration: 1.5, ease: "easeInOut", delay: 1.5 }
    },
    reduced: {
      clipPath: "circle(100% at 50% 50%)",
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 }
    }
  };

  const orbitLineVariants: Variants = {
    initial: { opacity: 0, scale: 0.9, rotate: -20 },
    reveal: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { duration: 2, ease: "easeOut", delay: 3.0 }
    }
  };

  const ambientMotion: TargetAndTransition | {} =
    sequenceComplete && !prefersReducedMotion
      ? {
          rotateX: mousePosition.y * -5,
          rotateY: mousePosition.x * 5,
          transition: { type: "spring", stiffness: 50, damping: 20 },
        }
      : {};

  return (
    <div className="intention-formation-container" ref={containerRef}>
      {/* Light sweep effect across the single bead */}
      {!prefersReducedMotion && !sequenceComplete && (
        <motion.div
          className="intention-light-sweep"
          initial={{ left: "-20%", opacity: 0 }}
          animate={{ left: "120%", opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, delay: 1.0, ease: "easeInOut" }}
        />
      )}

      {/* The main bracelet image */}
      <motion.div
        className="intention-bracelet-wrapper"
        initial="initial"
        animate={prefersReducedMotion ? "reduced" : ["singleBead", "formation"]}
        variants={imageRevealVariants}
        style={{ perspective: 1000 }}
      >
        <motion.div animate={ambientMotion} className="intention-bracelet-inner">
          <CataloguePhoto
            slug={productSlug}
            sizes="(max-width:700px) 88vw, 600px"
            priority
          />
        </motion.div>
      </motion.div>

      {/* Refined thin bronze circular line that completes the composition */}
      <motion.div
        className="intention-orbit-line"
        initial="initial"
        animate={prefersReducedMotion ? { opacity: 1, scale: 1, rotate: 0 } : "reveal"}
        variants={orbitLineVariants}
      />

      {/* Very slow ambient light drift across the completed setup */}
      {sequenceComplete && !prefersReducedMotion && (
        <motion.div
          className="intention-ambient-highlight"
          animate={{
            x: ["-100%", "100%"],
            opacity: [0, 0.15, 0]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            delay: 4
          }}
        />
      )}
    </div>
  );
}
