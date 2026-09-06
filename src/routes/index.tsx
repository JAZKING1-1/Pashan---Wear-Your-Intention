import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { EditorialStack } from "@/components/EditorialStack";
import { IntentionBeads } from "@/components/IntentionBeads";
import { PeacockGlyph } from "@/components/BrandMark";
import { PackagingShowcase } from "@/components/PackagingShowcase";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { DailyNote } from "@/components/DailyNote";
import { BotanicalSeal, LeafDivider } from "@/components/CraftOrnaments";
import { collections, intentions } from "@/data/products";
import { useCart } from "@/lib/cart";
import { WELCOME_OFFER_CODE } from "@/lib/offers";
import heroImage from "@/assets/brand/packaging-cardboard.webp";
import packagingOverhead from "@/assets/brand/packaging-overhead.webp";
import packagingRitual from "@/assets/brand/packaging-ritual.webp";
import tigerCampaign from "@/assets/products/tiger-eye/05.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PASHAN — Himalayan Gemstone Bracelets" },
      {
        name: "description",
        content:
          "Premium natural gemstone bracelets from Haridwar. Rooted in Himalayan calm, made with intention in India.",
      },
      { property: "og:title", content: "PASHAN — Stone · Energy · Intention" },
      {
        property: "og:description",
        content:
          "Natural gemstone bracelets for courage, clarity, grounding, balance, and renewal.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <Hero />
      <HousePromise />
      <EditorialStack />
      <IntentionBeads />
      <CollectionEdit />
      <DailyNote />
      <HimalayanStory />
      <IntentionFinder />
      <PackagingShowcase />
      <JournalAndCircle />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="premium-hero grain pashan-atelier-hero">
      <img
        src={heroImage}
        alt="Complete PASHAN bracelet presentation in a kraft gifting box"
        className="premium-hero-image"
      />
      <div className="premium-hero-overlay" />
      <div className="premium-hero-lines" aria-hidden />
      <BotanicalSeal className="atelier-hero-seal" />
      <div className="container-luxe premium-hero-inner">
        <div className="premium-hero-copy">
          <div className="hero-overline">
            <span /> Natural gemstone bracelets, made in India <span />
          </div>
          <h1>
            Wear the quality
            <br />
            you wish to <em>become.</em>
          </h1>
          <p>
            Natural gemstone bracelets from Haridwar, composed as quiet symbols
            of courage, balance, focus, and renewal.
          </p>
          <LeafDivider className="atelier-leaf-divider" />
          <div className="hero-actions">
            <Link
              to="/products/$slug"
              params={{ slug: "make-your-own" }}
              className="btn-gold"
            >
              Create your personalised bracelet <span>↗</span>
            </Link>
            <Link to="/collections" className="text-link">
              Shop all bracelets <span>→</span>
            </Link>
          </div>
        </div>
        <Link
          to="/products/$slug"
          params={{ slug: "tiger-eye" }}
          className="hero-object-card"
        >
          <div className="hero-object-image">
            <img
              src={tigerCampaign}
              alt="Pop-art Tiger Eye bracelet campaign"
            />
          </div>
          <div>
            <span>Most loved · 01</span>
            <strong>Tiger's Eye</strong>
            <small>Courage · Focus · Protection</small>
          </div>
        </Link>
        <div className="hero-scroll">
          <span /> Scroll to enter
        </div>
      </div>
    </section>
  );
}

function HousePromise() {
  const promises = [
    [
      "01",
      "Authentic natural stone",
      "Each piece is selected for natural character, tone, and finish.",
    ],
    [
      "02",
      "Handmade with intention",
      "Composed bead by bead in India, in small considered batches.",
    ],
    [
      "03",
      "A complete ritual",
      "Presentation box, stone story, intention card, and authenticity details.",
    ],
  ];
  return (
    <section className="promise-strip">
      <div className="container-luxe promise-grid">
        {promises.map(([number, title, copy], index) => (
          <Reveal key={title} delay={index * 100} className="promise-item">
            <span>{number}</span>
            <div>
              <h2>{title}</h2>
              <p>{copy}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CollectionEdit() {
  return (
    <section className="collection-edit section-space">
      <div className="container-luxe">
        <Reveal className="section-heading split-heading">
          <div>
            <div className="eyebrow">
              The complete edit · Seven stones + one custom piece
            </div>
            <h2>
              Objects of <em>intention.</em>
            </h2>
          </div>
          <p>
            Every bracelet begins with a quality worth carrying. Explore the
            catalogue by stone, intention, or the colour that catches your eye.
          </p>
        </Reveal>
        <div className="collection-grid-premium">
          {collections.map((product, index) => (
            <Reveal key={product.slug} delay={(index % 4) * 80}>
              <ProductCard product={product} index={index} />
            </Reveal>
          ))}
        </div>
        <div className="collection-endnote">
          <PeacockGlyph />
          <span>
            Natural variation is not a flaw. It is the character of the stone.
          </span>
          <Link to="/collections">View catalogue details →</Link>
        </div>
      </div>
    </section>
  );
}

function HimalayanStory() {
  return (
    <section className="story-editorial">
      <div className="story-image story-image-main">
        <img
          src={packagingRitual}
          alt="Ivory PASHAN presentation box with bracelet and authenticity details"
        />
      </div>
      <div className="story-copy-panel grain">
        <Reveal>
          <div className="eyebrow">Rooted in Earth · Aligned in Spirit</div>
          <h2>From Himalayan stillness to the rhythm of modern life.</h2>
          <p>
            <em>Pashan</em> is a Sanskrit word meaning stone. Born from the
            spirit of the Himalayas, the house brings ancient material wisdom
            into a fast-moving world with a distinctly contemporary eye.
          </p>
          <p>
            We do not promise magic. We make meaningful objects: natural stones,
            honest symbolism, fine presentation, and a daily invitation to
            choose deliberately.
          </p>
          <blockquote className="founder-sentiment">“A creation is born when one keeps the faith and finds the divine madness within.”</blockquote>
          <Link to="/about" className="btn-outline-light">
            Enter our story <span>↗</span>
          </Link>
        </Reveal>
      </div>
      <div className="story-image story-image-side">
        <img
          src={packagingOverhead}
          alt="Overhead view of the complete ivory PASHAN presentation"
        />
      </div>
    </section>
  );
}

function IntentionFinder() {
  return (
    <section className="intention-section section-space">
      <div className="container-luxe intention-layout">
        <Reveal className="intention-intro">
          <div className="eyebrow">Choose by intention</div>
          <h2>Begin with a word.</h2>
          <p>
            Sometimes the clearest way to choose a stone is to name what you
            want more of in your days.
          </p>
          <Link to="/find-your-bracelet" className="text-link">
            Take the stone finder <span>→</span>
          </Link>
        </Reveal>
        <div className="intention-list">
          {intentions.map((item, index) => (
            <Reveal key={item.key} delay={index * 65}>
              <Link to="/products/$slug" params={{ slug: item.slug }}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.label}</strong>
                <i>Discover stone</i>
                <b>↗</b>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function JournalAndCircle() {
  const { applyOffer } = useCart();
  const [joined, setJoined] = useState(false);

  const joinCircle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJoined(applyOffer(WELCOME_OFFER_CODE).success);
  };

  return (
    <section className="circle-section section-space">
      <div className="container-luxe circle-grid">
        <Reveal className="circle-manifesto">
          <PeacockGlyph />
          <div className="eyebrow">A quiet house note</div>
          <blockquote>
            “What you wear can be decoration. Or it can be a decision.”
          </blockquote>
          <p>PASHAN · Haridwar, Uttarakhand</p>
        </Reveal>
        <Reveal className="circle-signup" delay={120}>
          <div className="eyebrow">The daily PASHAN note</div>
          <h2>Older wisdom, made useful for modern days.</h2>
          <p>
            Daily reflections on grounding rituals, natural traditions, and
            simple practices for finding steadiness when life feels full. Join
            the circle and unlock 10% off your first order.
          </p>
          <form onSubmit={joinCircle}>
            <label>
              <span className="sr-only">Email address</span>
              <input type="email" required placeholder="Your email address" />
            </label>
            <button type="submit">
              Unlock 10% off <span>→</span>
            </button>
          </form>
          {joined ? (
            <p className="circle-signup-success" role="status">
              Welcome offer active. Code {WELCOME_OFFER_CODE} is now in your
              bag.
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
