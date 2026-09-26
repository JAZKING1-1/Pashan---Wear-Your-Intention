import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Gift, MoveUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ritualKit } from "@/data/ritual-kit";
import { LeafDivider } from "./CraftOrnaments";
import "@/styles-ritual-kit.css";

const PHOTO = "/images/ritual-kit/pashan-box-960.webp";
const PHOTO_SET = [480, 960, 1440]
  .map((width) => `/images/ritual-kit/pashan-box-${width}.webp ${width}w`)
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

export function PackagingShowcase() {
  const [view, setView] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A cached/early SSR image can fail before React attaches onError.
    const image = imageRef.current;
    if (image?.complete && image.currentSrc && !image.naturalWidth)
      setImageFailed(true);
  }, []);
  const active = VIEWS[view];
  return (
    <section
      id="ritual-kit"
      className="ritual-kit section-space"
      aria-labelledby="ritual-kit-title"
      tabIndex={-1}
      lang="en"
      dir="ltr"
    >
      <div className="container-luxe ritual-kit-layout">
        <header className="ritual-kit-intro">
          <p className="ritual-kit-eyebrow">
            <Gift size={18} aria-hidden="true" /> Our gift to you
          </p>
          <h2 id="ritual-kit-title">
            Not just a piece.
            <br />A ritual, included.
          </h2>
          <p className="ritual-kit-promise">{ritualKit.headline}</p>
          <p className="ritual-kit-description">
            Choose something meaningful. Let the unboxing become a moment of its
            own — to pause, set an intention and begin wearing your piece.
          </p>
        </header>

        <figure
          className="ritual-kit-gallery"
          aria-label="PASHAN ritual kit photograph"
        >
          <div className={`ritual-kit-photo ${active.className}`}>
            {imageFailed ? (
              <div className="ritual-kit-image-error" role="status">
                <Gift size={32} aria-hidden="true" />
                <p>
                  The kit photograph could not load. The details are still
                  available below.
                </p>
              </div>
            ) : (
              <img
                ref={imageRef}
                src={PHOTO}
                srcSet={PHOTO_SET}
                sizes="(max-width:700px) calc(108vw - 62px), (max-width:1000px) 46vw, 620px"
                width={960}
                height={1707}
                loading="lazy"
                decoding="async"
                alt="Actual open PASHAN box with a pink-stone bracelet, a labelled Ganga Jal bottle, a packet of dhoop and a thank-you card."
                onError={() => setImageFailed(true)}
              />
            )}
            <span className="ritual-kit-photo-label">The PASHAN unboxing</span>
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
            <a
              href="/images/ritual-kit/pashan-box-1440.webp"
              target="_blank"
              rel="noreferrer"
            >
              See the full photograph{" "}
              <MoveUpRight size={14} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </figcaption>
        </figure>

        <div className="ritual-kit-details">
          <p className="ritual-kit-details-label">
            Inside the photographed box
          </p>
          <ol>
            {DETAILS.map((item, index) => (
              <li key={item.title}>
                <span className="ritual-kit-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="ritual-kit-footnote">
            Your kit accompanies the product you choose; seasonal packaging and
            additional extras may differ.
          </p>
        </div>

        <div className="ritual-kit-actions">
          <Link
            to="/collections"
            className="ritual-button ritual-button-saffron"
          >
            Choose your piece <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <span>{ritualKit.summary}</span>
        </div>
      </div>
      <div className="ritual-kit-divider">
        <LeafDivider />
      </div>
    </section>
  );
}
