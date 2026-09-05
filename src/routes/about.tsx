import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gem,
  Hand,
  Leaf,
  Sparkles,
} from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";
import { PashanSymbol } from "@/components/BrandMark";
import { SiteLayout } from "@/components/SiteLayout";
import { WeeklyWisdomSignup } from "@/components/WeeklyWisdomSignup";
import atmosphere from "@/assets/atmosphere.jpg";
import aboutCraft from "@/assets/about/craft.webp";
import aboutEarth from "@/assets/about/earth.webp";
import aboutHonesty from "@/assets/about/honesty.webp";
import aboutIntention from "@/assets/about/intention.webp";
import craft from "@/assets/craft.jpg";
import pyriteCampaign from "@/assets/products/pyrite/03.webp";
import pyritePortrait from "@/assets/products/pyrite/04.webp";
import tigerEyeCampaign from "@/assets/products/tiger-eye/08.webp";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "The House - PASHAN" },
      {
        name: "description",
        content:
          "PASHAN is a house of handcrafted natural-stone bracelets: wearable symbols composed with intention.",
      },
      { property: "og:title", content: "The House - PASHAN" },
      {
        property: "og:description",
        content:
          "The philosophy behind PASHAN: intention as a wearable practice.",
      },
    ],
  }),
  component: AboutPage,
});

const houseLine = [
  ["01", "Intention", "Choose what you wish to practise."],
  ["02", "Earth", "Begin with material shaped by nature."],
  ["03", "Craft", "Compose slowly, bead by bead."],
  ["04", "Ritual", "Give an everyday object meaning."],
  ["05", "Restraint", "Promise only what can be honoured."],
] as const;

const principles = [
  {
    name: "Intention",
    eyebrow: "A private direction",
    statement: "Meaning begins before the bracelet is worn.",
    copy: "A PASHAN piece starts with a quality you want to keep close: courage, focus, stillness, renewal, or a direction entirely your own.",
    image: aboutIntention,
    imageAlt:
      "Woman holding a gemstone bracelet during a quiet riverside ritual",
    objectPosition: "64% center",
    imageFit: "cover",
  },
  {
    name: "Earth",
    eyebrow: "Natural character",
    statement: "Variation is not a flaw. It is natural character.",
    copy: "Stone carries natural shifts in tone, banding, texture, and clarity. We preserve that character instead of asking every piece to look identical.",
    image: aboutEarth,
    imageAlt:
      "Natural gemstone formations presented against a Himalayan river landscape",
    objectPosition: "center center",
    imageFit: "cover",
  },
  {
    name: "Craft",
    eyebrow: "Made by hand",
    statement: "The standard lives in the small decisions.",
    copy: "Proportion, rhythm, finishing, and presentation are considered together. Each bracelet is composed as one complete object, not simply assembled.",
    image: aboutCraft,
    imageAlt: "PASHAN makers composing gemstone bracelets by hand",
    objectPosition: "54% center",
    imageFit: "cover",
  },
  {
    name: "Honesty",
    eyebrow: "A clear promise",
    statement: "A symbol can be powerful without becoming a claim.",
    copy: "We honour traditional associations while making no medical or supernatural promises. What remains is personal: a beautiful reminder of your intention.",
    image: aboutHonesty,
    imageAlt:
      "Natural stone laboratory certificates arranged for authenticity verification",
    objectPosition: "center center",
    imageFit: "contain",
  },
] as const;

const craftValues = [
  {
    icon: Leaf,
    title: "Natural",
    copy: "Selected for colour, texture, and individual character.",
  },
  {
    icon: Hand,
    title: "Handmade",
    copy: "Balanced and composed bead by bead in India.",
  },
  {
    icon: Gem,
    title: "Considered",
    copy: "Stone, proportion, finish, and ritual designed together.",
  },
  {
    icon: Sparkles,
    title: "Enduring",
    copy: "Made to gather meaning through use, not chase a season.",
  },
] as const;

function AboutPage() {
  const railRef = useRef<HTMLDivElement>(null);
  const [activePrinciple, setActivePrinciple] = useState(0);
  const principle = principles[activePrinciple] ?? principles[0];

  const moveRail = (direction: -1 | 1) => {
    railRef.current?.scrollBy({
      left: direction * Math.min(560, railRef.current.clientWidth * 0.78),
      behavior: "smooth",
    });
  };

  return (
    <SiteLayout>
      <section className="house-hero">
        <img src={atmosphere} alt="PASHAN natural-stone atmosphere" />
        <div className="container-luxe house-hero-inner">
          <span className="house-kicker">The House of Pashan</span>
          <h1>
            We craft <em>symbols.</em>
            <br />
            Not simply jewellery.
          </h1>
          <p>
            Natural stone, Indian craft, and a quieter idea of luxury: wear the
            quality you wish to become.
          </p>
        </div>
      </section>

      <section className="house-line-band" aria-labelledby="house-line-title">
        <div className="container-luxe house-line-heading">
          <div>
            <span className="house-kicker">The House Line</span>
            <h2 id="house-line-title">Five ideas. One continuous practice.</h2>
          </div>
          <div className="house-rail-controls">
            <button
              type="button"
              onClick={() => moveRail(-1)}
              aria-label="Move the house line left"
              title="Previous"
            >
              <ChevronLeft aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => moveRail(1)}
              aria-label="Move the house line right"
              title="Next"
            >
              <ChevronRight aria-hidden />
            </button>
          </div>
        </div>
        <div className="house-line-rail" ref={railRef}>
          <div className="house-line-track">
            {houseLine.map(([number, title, copy]) => (
              <article key={title}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="house-philosophy">
        <div className="container-luxe house-philosophy-intro">
          <span className="house-kicker">Philosophy</span>
          <h2>
            People choose objects that say something about who they are
            <em> becoming.</em>
          </h2>
          <p>
            For centuries, natural stones have been connected with the qualities
            people aspire to embody. PASHAN honours that lineage with
            contemporary restraint, careful craft, and complete honesty.
          </p>
        </div>

        <div className="container-luxe belief-studio">
          <div
            className="belief-tabs"
            role="tablist"
            aria-label="PASHAN principles"
          >
            {principles.map((item, index) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={activePrinciple === index}
                aria-controls="belief-panel"
                className={activePrinciple === index ? "is-active" : ""}
                onClick={() => setActivePrinciple(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.name}
              </button>
            ))}
          </div>

          <div
            className={`belief-visual is-${principle.imageFit}`}
            style={
              {
                "--belief-position": principle.objectPosition,
              } as CSSProperties
            }
          >
            <img
              key={principle.name}
              src={principle.image}
              alt={principle.imageAlt}
            />
            <div className="belief-bead-line">
              {Array.from({ length: 11 }, (_, index) => (
                <i key={index} />
              ))}
            </div>
            <span>{principle.name}</span>
          </div>

          <div
            id="belief-panel"
            className="belief-copy"
            role="tabpanel"
            key={principle.name}
          >
            <span>{principle.eyebrow}</span>
            <h3>{principle.statement}</h3>
            <p>{principle.copy}</p>
          </div>
        </div>
      </section>

      <section className="house-campaign" aria-label="PASHAN campaign imagery">
        <figure className="house-campaign-wide">
          <img
            src={tigerEyeCampaign}
            alt="Tiger Eye bracelet beside the Ganga at golden hour"
          />
          <figcaption>Tiger Eye / Courage in practice</figcaption>
        </figure>
        <figure>
          <img
            src={pyritePortrait}
            alt="Pyrite bracelet worn beside the river"
          />
          <figcaption>Pyrite / Ambition made visible</figcaption>
        </figure>
        <figure>
          <img
            src={pyriteCampaign}
            alt="Pyrite bracelet presented on a river stone"
          />
          <figcaption>Natural stone / Individual character</figcaption>
        </figure>
      </section>

      <section className="house-atelier">
        <div className="container-luxe house-atelier-grid">
          <div className="house-atelier-image">
            <img src={craft} alt="PASHAN bracelet craftsmanship" />
            <span>Crafted with intention</span>
          </div>
          <div className="house-atelier-copy">
            <span className="house-kicker">Made by hand</span>
            <h2>
              Considered. Composed. <em>Unhurried.</em>
            </h2>
            <p>
              Every piece is composed in small numbers. Stones are chosen for
              natural character, and finishing receives the patience that good
              work requires.
            </p>
            <div className="craft-value-bars">
              {craftValues.map(({ icon: Icon, title, copy }, index) => (
                <article
                  key={title}
                  style={
                    { "--bar-width": `${58 + index * 9}%` } as CSSProperties
                  }
                >
                  <Icon aria-hidden />
                  <div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                    <i aria-hidden />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="house-invitation">
        <div className="container-luxe">
          <PashanSymbol />
          <span className="house-kicker">An Invitation</span>
          <h2>Wear the quality you wish to become.</h2>
          <div className="house-invitation-actions">
            <Link to="/collections" className="btn-gold">
              Explore the seven <ArrowRight aria-hidden />
            </Link>
            <Link to="/find-your-bracelet" className="house-text-link">
              Enter the stone studio
            </Link>
          </div>
        </div>
      </section>
      <div className="container-luxe house-weekly-note">
        <WeeklyWisdomSignup />
      </div>
    </SiteLayout>
  );
}
