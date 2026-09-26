import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Plus, Minus } from "lucide-react";
import { BotanicalSeal, LeafDivider } from "@/components/CraftOrnaments";
import {
  findRashi,
  rashiCatalogue,
  RASHI_OFFER,
  rashiEnquiry,
  type RashiProduct,
} from "@/data/rashi-catalogue";
import "@/styles-rashi.css";
import { OpeningRitual } from "@/components/OpeningRitual";
import { SacredStories } from "@/components/SacredStories";
import { ritualKit } from "@/data/ritual-kit";

export function RashiImage({
  product,
  large = false,
  eager = false,
}: {
  product: RashiProduct;
  large?: boolean;
  eager?: boolean;
}) {
  return (
    <img
      src={large ? product.imageLarge : product.image}
      srcSet={product.image + " 480w, " + product.imageLarge + " 960w"}
      sizes={
        large
          ? "(max-width: 700px) 90vw, 520px"
          : "(max-width: 540px) 45vw, (max-width: 1000px) 30vw, 280px"
      }
      width={480}
      height={product.landscape ? 270 : product.slug === "gemini" ? 856 : 853}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      alt={
        product.name +
        " Rakhi: beaded woven cord with a black zodiac plaque, photographed on ivory cloth"
      }
    />
  );
}
export function RashiCard({ product }: { product: RashiProduct }) {
  return (
    <article className="rashi-product-card">
      <Link
        to="/rakhi/rashi/$slug"
        params={{ slug: product.slug }}
        className="rashi-card-link"
      >
        <div className="rashi-card-photo">
          <RashiImage product={product} />
          <span aria-hidden="true">{product.symbol}</span>
        </div>
        <div className="rashi-card-copy">
          <p className="rashi-small">
            <span lang="hi">{product.hindi}</span> · Rashi Rakhi
          </p>
          <h3>{product.name}</h3>
          <p className="rashi-card-intention">{product.intention}</p>
          <p className="rashi-card-price">
            <strong>₹{product.price}</strong>
          </p>
          <span className="rashi-card-action">
            View this piece <ArrowRight size={17} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
export function RashiExperience({
  sign,
  onSignChange,
}: {
  sign?: string;
  onSignChange: (slug?: string) => void;
}) {
  const selected = sign ? findRashi(sign) : undefined;
  const products = selected ? [selected] : rashiCatalogue;
  const [noteOpen, setNoteOpen] = useState(false);
  const reduced = useReducedMotion();
  return (
    <div className="rashi-experience">
      <div className="rashi-hero-surface">
        <section className="rashi-hero rashi-container">
          <div className="rashi-hero-copy">
            <p className="rashi-eyebrow">PASHAN · Objects of intention</p>
            <h1>
              A thread of connection.
              <br />
              <em>A sign of you.</em>
            </h1>
            <p>
              Twelve Rashis. Twelve ways to make a gift personal. Discover
              beaded cord Rakhis with a zodiac detail to carry close.
            </p>
            <a href="#rashi-collection" className="rashi-primary">
              Find your Rashi <ArrowRight size={18} aria-hidden="true" />
            </a>
            <div className="rashi-hero-offer">
              <strong>₹899</strong>
              <span>
                Introductory offer · per piece
                <br />
                <a href="#rashi-offer-terms">View offer details</a>
              </span>
            </div>
          </div>
          <OpeningRitual
            image={rashiCatalogue[0].imageLarge}
            alt="Aries Rashi Rakhi, complete woven cord and zodiac beads on ivory cloth"
          />
        </section>
      </div>
      <div className="rashi-service-row rashi-container">
        <span>12 zodiac designs</span>
        <span>Photographs of the pieces</span>
        <span>Personal fit guidance</span>
      </div>
      <section
        className="rashi-selection rashi-container"
        id="rashi-collection"
        aria-labelledby="rashi-heading"
      >
        <div className="rashi-section-heading">
          <div>
            <p className="rashi-eyebrow">Choose a connection</p>
            <h2 id="rashi-heading">Begin with your sign.</h2>
          </div>
          <p>
            Choose a Rashi you know, or simply a design you love. This is a
            collection, not a birth-chart reading.
          </p>
        </div>
        <div className="rashi-signs" role="group" aria-label="Filter by Rashi">
          <button
            type="button"
            aria-pressed={!selected}
            onClick={() => onSignChange()}
          >
            <span aria-hidden="true">✧</span>All 12 signs
            {!selected && <Check size={14} aria-hidden="true" />}
          </button>
          {rashiCatalogue.map((product) => (
            <button
              type="button"
              key={product.slug}
              aria-pressed={selected?.slug === product.slug}
              onClick={() => onSignChange(product.slug)}
            >
              <span aria-hidden="true">{product.symbol}</span>
              {product.name}
              {selected?.slug === product.slug && (
                <Check size={14} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
        <div className="rashi-result-line">
          <p role="status">
            {products.length} {products.length === 1 ? "piece" : "pieces"} ·
            ₹899 each
          </p>
          {selected && (
            <button type="button" onClick={() => onSignChange()}>
              Show all signs
            </button>
          )}
        </div>
        <div
          className={"rashi-product-grid" + (selected ? " is-filtered" : "")}
        >
          {products.map((product) => (
            <RashiCard key={product.slug} product={product} />
          ))}
          {selected && (
            <aside
              className="rashi-reflection"
              aria-label="A moment of reflection"
            >
              <motion.div
                initial={false}
                animate={{
                  rotate: reduced ? 0 : rashiCatalogue.indexOf(selected) * 30,
                }}
                transition={{ duration: reduced ? 0 : 0.4 }}
                className="rashi-reflection-seal"
              >
                <BotanicalSeal />
              </motion.div>
              <p className="rashi-eyebrow">A thought to carry</p>
              <h2>{selected.intention}</h2>
              <p>{selected.reflection}</p>
              <small>An editorial reflection, not a prediction.</small>
            </aside>
          )}
        </div>
      </section>
      <section className="rashi-pause">
        <div className="rashi-container">
          <LeafDivider />
          <p className="rashi-eyebrow">Ancient symbols, modern desire.</p>
          <h2>The meaning is yours to make.</h2>
          <p>
            A sign can be a reminder of someone you love, a quality you admire,
            or a story you share. No promised outcomes. Just an invitation to
            choose deliberately.
          </p>
          <button
            type="button"
            className="rashi-note-trigger"
            aria-expanded={noteOpen}
            aria-controls="rashi-note"
            onClick={() => setNoteOpen(!noteOpen)}
          >
            {noteOpen ? (
              <Minus aria-hidden="true" size={18} />
            ) : (
              <Plus aria-hidden="true" size={18} />
            )}
            A moment for you
          </button>
          <div id="rashi-note" hidden={!noteOpen} className="rashi-note">
            <p>
              Think of someone who makes you feel at home. What would you like
              them to know today?
            </p>
            <small>A reflection prompt. No purchase or signup needed.</small>
          </div>
        </div>
      </section>
      <SacredStories />
      <section className="rashi-help rashi-container">
        <div>
          <p className="rashi-eyebrow">Choose with confidence</p>
          <h2>A little guidance.</h2>
          <Link to="/contact" className="rashi-text-link">
            Speak to PASHAN <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div>
          <details>
            <summary>Do I need to know my Rashi?</summary>
            <p>
              No. Select a sign you already know, or choose a design you connect
              with. We do not calculate a Vedic Rashi from a birthday alone.
            </p>
          </details>
          <details>
            <summary>How do fit and ordering work?</summary>
            <p>
              Each detail page opens an enquiry for that specific piece. Ask us
              to confirm the cord fit, materials, availability and dispatch
              before payment. These Rakhis are not yet available through website
              checkout.
            </p>
          </details>
          <details id="rashi-offer-terms">
            <summary>About the ₹899 introductory offer</summary>
            <p>
              ₹899 per Rashi Rakhi. Delivery charges, availability and the final
              order total must be confirmed before payment. No expiry date or
              additional discount combination is promised. {ritualKit.headline}
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
export function RashiProductDetail({ product }: { product: RashiProduct }) {
  const [zoom, setZoom] = useState(false);
  return (
    <div className="rashi-experience">
      <div className="rashi-container">
        <nav aria-label="Breadcrumb" className="rashi-breadcrumb">
          <Link to="/rashi">
            <ArrowLeft size={16} aria-hidden="true" />
            All Rashi pieces
          </Link>
          <span>/ {product.name}</span>
        </nav>
        <section className="rashi-detail">
          <div>
            <div className={"rashi-detail-photo" + (zoom ? " is-zoomed" : "")}>
              <RashiImage product={product} large eager />
            </div>
            <button
              className="rashi-photo-toggle"
              type="button"
              aria-pressed={zoom}
              onClick={() => setZoom(!zoom)}
            >
              {zoom ? "Show full photograph" : "Enlarge photograph"}
            </button>
          </div>
          <div className="rashi-detail-copy">
            <p className="rashi-eyebrow">
              <span lang="hi">{product.hindi}</span> · PASHAN Rashi Collection
            </p>
            <h1>{product.title}</h1>
            <p className="rashi-detail-intention">{product.intention}</p>
            <p className="rashi-detail-price">
              <strong>₹{product.price}</strong>
              <span>{RASHI_OFFER.label} · per piece</span>
            </p>
            <p>
              A beaded woven-cord Rakhi with a {product.name} zodiac plaque. A
              personal detail for a meaningful connection.
            </p>
            <div className="rashi-order-note">
              <strong>Confirm your piece with us</strong>
              <p>
                Availability, fit, exact materials and delivery are confirmed
                before you order. Website checkout is not enabled for this
                collection.
              </p>
            </div>
            <div className="ritual-kit-summary">
              <strong>{ritualKit.shortLabel}</strong>
              <p>{ritualKit.summary}</p>
              <Link to="/" hash="ritual-kit" className="text-link">
                See the ritual kit →
              </Link>
            </div>
            <a
              className="rashi-primary"
              href={rashiEnquiry(product)}
              target="_blank"
              rel="noreferrer"
            >
              Enquire on WhatsApp <ArrowRight size={18} aria-hidden="true" />
            </a>
            <p className="rashi-small">
              Opens WhatsApp with this piece and price. No payment or order is
              placed.
            </p>
            <Link to="/contact" className="rashi-text-link">
              Prefer another way? Contact us
            </Link>
            <details open>
              <summary>About the photograph &amp; materials</summary>
              <p>
                The image shows the cord, beads, zodiac plaque and gold-tone
                accents. Stone identities, metal composition and dimensions need
                maker confirmation; colour alone does not verify a gemstone. The
                photograph is not proof of certification.
              </p>
            </details>
            <details>
              <summary>Fit, care &amp; delivery</summary>
              <p>
                Ask for the supported wrist range and cord measurements. Do not
                assume one size fits every wrist. Until material-specific care
                is confirmed, keep dry and avoid perfumes and harsh cleaners.
                Confirm dispatch, shipping charges and return terms before
                payment.
              </p>
            </details>
            <details>
              <summary>Offer details</summary>
              <p>
                Introductory price ₹899 per piece. Delivery is confirmed
                separately. {ritualKit.headline} No automatic discount stacking
                or expiry date is promised.
              </p>
            </details>
          </div>
        </section>
        <section className="rashi-related">
          <div className="rashi-section-heading">
            <h2>Another connection.</h2>
            <Link to="/rashi">Explore all 12 signs →</Link>
          </div>
          <div className="rashi-product-grid">
            {rashiCatalogue
              .filter((item) => item.slug !== product.slug)
              .slice(0, 4)
              .map((item) => (
                <RashiCard key={item.slug} product={item} />
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
