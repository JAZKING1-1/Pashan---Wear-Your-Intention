import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Pause,
  Play,
  Rotate3D,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { LaunchPrice } from "@/components/LaunchPrice";
import { SiteLayout } from "@/components/SiteLayout";
import { StoneFinderFeedback } from "@/components/StoneFinderFeedback";
import { collections } from "@/data/products";

export const Route = createFileRoute("/find-your-bracelet")({
  head: () => ({
    meta: [
      { title: "Virtual Bracelet Studio - PASHAN" },
      {
        name: "description",
        content:
          "Explore seven PASHAN natural-stone bracelets in an interactive virtual studio.",
      },
      { property: "og:title", content: "Virtual Bracelet Studio - PASHAN" },
      {
        property: "og:description",
        content:
          "Move through seven PASHAN stones and discover their traditional qualities with a guided, personal experience.",
      },
    ],
  }),
  component: FindPage,
});

interface StoneProfile {
  nature: [string, string, string];
  bestFor: string;
  guidance: string;
  validation: string;
  traitDetails: [string, string, string];
}

const stoneProfiles: Record<string, StoneProfile> = {
  pyrite: {
    nature: ["Bold", "Metallic", "Energising"],
    bestFor: "ambitious starts, wealth-minded habits, and decisive action",
    guidance:
      "Choose Pyrite when you want a visible reminder to value your work, prepare carefully, and move with purpose.",
    validation:
      "A strong choice when you are building confidence, prosperity, or a braver relationship with opportunity.",
    traitDetails: [
      "A reminder to trust your preparation.",
      "Supports a bold, action-first mindset.",
      "Traditionally linked with prosperity.",
    ],
  },
  "tiger-eye": {
    nature: ["Focused", "Steady", "Courageous"],
    bestFor: "leadership, confident decisions, and calm forward movement",
    guidance:
      "Reach for Tiger Eye before a meeting, difficult choice, or new responsibility. Let its golden bands remind you to slow down and see clearly.",
    validation:
      "A thoughtful choice for confidence, leadership, courage, and clear decisions.",
    traitDetails: [
      "Encourages trust in your own judgement.",
      "A steady symbol for brave choices.",
      "Traditionally carried as a protective stone.",
    ],
  },
  hematite: {
    nature: ["Grounded", "Disciplined", "Stable"],
    bestFor: "deep work, firm boundaries, and steady daily routines",
    guidance:
      "Use Hematite as a cue to return to the present task. Its weight and mirror-dark finish suit structured, focused days.",
    validation:
      "A grounded choice when you want steadier focus, clearer boundaries, and dependable routines.",
    traitDetails: [
      "Traditionally linked with emotional steadiness.",
      "A practical reminder to finish one task at a time.",
      "Its weight gives a tangible sense of grounding.",
    ],
  },
  amethyst: {
    nature: ["Reflective", "Quiet", "Clear"],
    bestFor: "stillness, thoughtful communication, and evening reflection",
    guidance:
      "Choose Amethyst for moments that ask you to pause before responding. Pair it with a short breath or journaling ritual.",
    validation:
      "A gentle choice when you are seeking calm, balance, clarity, or a quieter pace.",
    traitDetails: [
      "A visual cue to soften the pace.",
      "Associated with emotional balance.",
      "Supports reflection before action.",
    ],
  },
  "green-quartz": {
    nature: ["Fresh", "Optimistic", "Renewing"],
    bestFor: "new chapters, positive habits, and patient personal growth",
    guidance:
      "Wear Green Quartz when beginning again. Let the fresh colour mark one small action you can repeat consistently.",
    validation:
      "A hopeful choice for renewal, positivity, growth, and patient progress.",
    traitDetails: [
      "Represents patient, natural growth.",
      "A bright reminder to notice possibility.",
      "Suited to fresh starts and renewed habits.",
    ],
  },
  lava: {
    nature: ["Elemental", "Textured", "Resilient"],
    bestFor: "change, endurance, courageous action, and rebuilding",
    guidance:
      "Choose Lava Stone when life feels in motion. Its porous texture is a reminder that strength can be shaped through change.",
    validation:
      "A resilient choice when you are navigating change, rebuilding strength, or choosing courage.",
    traitDetails: [
      "A symbol of strength shaped over time.",
      "Associated with brave movement through change.",
      "Its raw texture represents resilience.",
    ],
  },
  "dhan-yog": {
    nature: ["Composed", "Purposeful", "Abundant"],
    bestFor: "opportunity, focused effort, balanced ambition, and prosperity",
    guidance:
      "Dhan Yog combines five stones into one considered rhythm. Choose it when you want a layered reminder that opportunity also needs focus.",
    validation:
      "A considered choice for opportunity, focused ambition, prosperity, and balanced momentum.",
    traitDetails: [
      "A five-stone symbol for recognising possibility.",
      "Balances ambition with deliberate attention.",
      "Traditionally associated with prosperity.",
    ],
  },
};

const bracelets = collections.filter((collection) => !collection.isCustom);
const orbitBeads = Array.from({ length: 18 }, (_, index) => index);

function FindPage() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [view, setView] = useState<"live" | "detail">("live");
  const [guideSide, setGuideSide] = useState<"image" | "guide">("image");
  const [autoGuide, setAutoGuide] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [exploredStones, setExploredStones] = useState<string[]>(() => {
    const initial = bracelets[1] ?? bracelets[0];
    return initial ? [initial.slug] : [];
  });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPrompted, setFeedbackPrompted] = useState(false);
  const active = bracelets[activeIndex] ?? bracelets[0];

  useEffect(() => {
    if (
      view !== "live" ||
      !autoGuide ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setGuideSide((current) => (current === "image" ? "guide" : "image"));
    }, 2800);

    return () => window.clearInterval(timer);
  }, [activeIndex, autoGuide, view]);

  useEffect(() => {
    if (exploredStones.length < 2 || feedbackPrompted) return;

    const timer = window.setTimeout(() => {
      setFeedbackOpen(true);
      setFeedbackPrompted(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [exploredStones, feedbackPrompted]);

  if (!active) return null;

  const profile = stoneProfiles[active.slug] ?? stoneProfiles["tiger-eye"]!;
  const previewImage = active.images[1] ?? active.image;
  const showGuide = view === "detail" || guideSide === "guide";

  const chooseIndex = (index: number) => {
    const next = bracelets[index];
    if (!next) return;

    setActiveIndex(index);
    setTilt({ x: 0, y: 0 });
    setView("live");
    setGuideSide("image");
    setAutoGuide(true);
    setExploredStones((current) =>
      current.includes(next.slug) ? current : [...current, next.slug],
    );
  };

  const moveSelection = (direction: -1 | 1) => {
    chooseIndex(
      (activeIndex + direction + bracelets.length) % bracelets.length,
    );
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientY - bounds.top) / bounds.height - 0.5) * -8,
      y: ((event.clientX - bounds.left) / bounds.width - 0.5) * 10,
    });
  };

  const previewStyle = {
    "--studio-shift-x": `${tilt.y * 0.45}px`,
    "--studio-shift-y": `${tilt.x * -0.3}px`,
  } as CSSProperties;

  return (
    <SiteLayout>
      <section className="virtual-finder">
        <div className="container-luxe virtual-finder-intro">
          <div>
            <span className="finder-kicker">The Pashan Stone Quest</span>
            <h1>
              Meet all seven.
              <br />
              <em>Notice what calls you.</em>
            </h1>
          </div>
          <div className="finder-intro-copy">
            <p>
              Select a bracelet and let each card turn to reveal its nature,
              traditional associations, and a simple way to wear it.
            </p>
            <span>
              <Sparkles size={15} aria-hidden /> Seven stones / one intention
            </span>
          </div>
        </div>

        <div className="container-luxe virtual-studio-shell">
          <nav
            className="stone-selector"
            aria-label="Choose a bracelet to preview"
            role="tablist"
          >
            {bracelets.map((bracelet, index) => (
              <button
                key={bracelet.slug}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-controls="virtual-bracelet-stage"
                className={index === activeIndex ? "is-active" : ""}
                onClick={() => chooseIndex(index)}
              >
                <span className="stone-selector-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="stone-selector-thumb">
                  <img src={bracelet.image} alt="" />
                </span>
                <span>
                  <strong>{bracelet.stone}</strong>
                  <small>{bracelet.name}</small>
                </span>
              </button>
            ))}
          </nav>

          <div className="virtual-studio-main">
            <div className="studio-toolbar">
              <div className="studio-live-copy">
                <i aria-hidden />
                Guided bracelet view
                <button
                  type="button"
                  className="studio-auto-toggle"
                  onClick={() => setAutoGuide((current) => !current)}
                  aria-label={
                    autoGuide ? "Pause automatic guide" : "Play automatic guide"
                  }
                  title={
                    autoGuide ? "Pause automatic guide" : "Play automatic guide"
                  }
                >
                  {autoGuide ? (
                    <Pause aria-hidden size={14} />
                  ) : (
                    <Play aria-hidden size={14} />
                  )}
                </button>
              </div>
              <div className="studio-view-toggle" aria-label="Preview mode">
                <button
                  type="button"
                  className={view === "live" ? "is-active" : ""}
                  onClick={() => {
                    setView("live");
                    setGuideSide("image");
                    setAutoGuide(true);
                  }}
                  aria-pressed={view === "live"}
                >
                  Live view
                </button>
                <button
                  type="button"
                  className={view === "detail" ? "is-active" : ""}
                  onClick={() => {
                    setView("detail");
                    setGuideSide("guide");
                    setAutoGuide(false);
                  }}
                  aria-pressed={view === "detail"}
                >
                  Stone guide
                </button>
              </div>
            </div>

            <div
              id="virtual-bracelet-stage"
              className={`virtual-bracelet-stage tone-${active.tone}`}
              role="tabpanel"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setTilt({ x: 0, y: 0 })}
              style={previewStyle}
            >
              <div className="studio-halo" aria-hidden />
              <div className="studio-orbit" aria-hidden>
                {orbitBeads.map((bead) => (
                  <i key={bead} style={{ "--bead": bead } as CSSProperties} />
                ))}
              </div>
              <div className="studio-wrist" aria-hidden />

              <div
                className={`studio-product-frame ${showGuide ? "is-guide" : "is-image"}`}
                key={`product-${active.slug}-${showGuide ? "guide" : "image"}`}
              >
                {showGuide ? (
                  <div className="studio-card-single studio-card-back">
                    <span>Stone nature</span>
                    <strong>{profile.nature.join(" / ")}</strong>
                    <p>{profile.guidance}</p>
                    <small>Especially suited to</small>
                    <p>{profile.bestFor}.</p>
                  </div>
                ) : (
                  <div className="studio-card-single studio-card-front">
                    <img
                      src={previewImage}
                      alt={`${active.stone} bracelet live preview`}
                    />
                  </div>
                )}
              </div>

              <div
                className="studio-benefits"
                key={`benefits-${active.slug}-${showGuide ? "guide" : "image"}`}
              >
                {active.qualities.map((quality, index) => (
                  <div
                    key={quality}
                    className="studio-benefit-card"
                    style={{ animationDelay: `${160 + index * 130}ms` }}
                  >
                    <span
                      className={
                        showGuide
                          ? "studio-benefit-back"
                          : "studio-benefit-front"
                      }
                    >
                      {!showGuide && (
                        <>
                          <i>{String(index + 1).padStart(2, "0")}</i>
                          {quality}
                        </>
                      )}
                      {showGuide && profile.traitDetails[index]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="studio-move-hint">
                <Rotate3D size={17} aria-hidden />
                Move across the image
              </div>
            </div>

            <div className="studio-discovery">
              <div className="studio-progress-copy">
                <span>
                  Stone {String(activeIndex + 1).padStart(2, "0")} of{" "}
                  {String(bracelets.length).padStart(2, "0")}
                </span>
                <div className="studio-progress-track" aria-hidden>
                  <i
                    style={{
                      width: `${((activeIndex + 1) / bracelets.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div
                className="studio-validation"
                key={`validation-${active.slug}`}
                aria-live="polite"
              >
                <Sparkles aria-hidden size={17} />
                <p>
                  <strong>Good choice.</strong> {profile.validation}
                </p>
              </div>

              <div className="studio-story" key={`story-${active.slug}`}>
                <span>{active.name}</span>
                <h2>{active.stone}</h2>
                <p>{active.story}</p>
                <div className="studio-nature-words">
                  {profile.nature.map((word) => (
                    <span key={word}>{word}</span>
                  ))}
                </div>
                <div className="studio-meta">
                  <span>{active.fit}</span>
                  <LaunchPrice
                    price={active.price}
                    compareAtPrice={active.compareAtPrice}
                    compact
                  />
                </div>
              </div>

              <div className="studio-actions">
                <div className="studio-stepper">
                  <button
                    type="button"
                    onClick={() => moveSelection(-1)}
                    aria-label="View previous bracelet"
                  >
                    <ChevronLeft aria-hidden size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSelection(1)}
                    aria-label="View next bracelet"
                  >
                    <ChevronRight aria-hidden size={20} />
                  </button>
                </div>
                <Link
                  to="/products/$slug"
                  params={{ slug: active.slug }}
                  className="studio-product-link"
                >
                  Choose {active.stone}
                  <ArrowRight aria-hidden size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container-luxe finder-footnote">
          <p>
            Natural stones are described through traditional associations, not
            medical claims. The best choice is the one you will enjoy wearing.
          </p>
          <div>
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="finder-feedback-link"
            >
              <MessageSquareText aria-hidden size={16} />
              Rate this guide
            </button>
            <Link to="/collections">See all seven together</Link>
          </div>
        </div>
      </section>

      <StoneFinderFeedback
        open={feedbackOpen}
        selectedStone={active.stone}
        exploredStones={exploredStones}
        onOpenChange={setFeedbackOpen}
      />
    </SiteLayout>
  );
}
