import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import {
  RASHI_OFFER,
  findRashi,
  guideToRashi,
  rashiCatalogue,
  rashiEnquiry,
  rashiFinderNote,
  type RashiProduct,
} from "@/data/rashi-catalogue";
import "@/styles-rashi-discovery.css";

const COMPARE_LIMIT = 3;
const today = new Date();

/**
 * Anything that floats over the page — the drawer, the comparison panel, the
 * tray and the finder — has to be portalled to the body. `.site-main` sets
 * `z-index: 1`, which makes it a stacking context, so a `position: fixed` layer
 * rendered inside it is pinned below the fixed site header no matter how large
 * its own z-index is.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function Overlay({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/** Escape closes whatever layer is on top. */
function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}

/** Stop the page behind a drawer or panel from scrolling under it. */
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

/** Send focus into an opening layer, and give it back on close. */
function useFocusOnOpen(open: boolean, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    node?.focus();
    return () => previous?.focus?.();
  }, [open, ref]);
}

// --- the finder -----------------------------------------------------------

function RashiFinder({
  onPick,
  onClose,
}: {
  onPick: (slug: string) => void;
  onClose: () => void;
}) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<{ product: RashiProduct; cusp: boolean } | null>(
    null,
  );
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const heading = useId();
  useEscape(true, onClose);
  useFocusOnOpen(true, panel);

  const digits = (raw: string, max: number) => raw.replace(/\D/g, "").slice(0, max);
  /** Two digits in the day box is a finished day, so move on to the month. */
  const advance = (next?: React.RefObject<HTMLInputElement | null>) => {
    window.requestAnimationFrame(() => next?.current?.focus());
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!day || !month || !year) {
      setError("Enter your day, month and year of birth.");
      setFound(null);
      return;
    }
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    const date = new Date(y, m - 1, d);
    const valid =
      date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
    if (!valid) {
      setError("That date does not exist. Check it and try again.");
      setFound(null);
      return;
    }
    if (date > today) {
      setError("That date is in the future. Enter a date in the past.");
      setFound(null);
      return;
    }
    if (y < 1900) {
      setError("Enter a date from 1900 onwards.");
      setFound(null);
      return;
    }
    const guide = guideToRashi(date);
    const product = guide && findRashi(guide.slug);
    if (!guide || !product) {
      setError("We could not read that date. Check it and try again.");
      setFound(null);
      return;
    }
    setError(null);
    setFound({ product, cusp: guide.cusp });
  };

  return (
    <motion.section
      ref={panel}
      className="rashi-finder"
      role="dialog"
      aria-modal="true"
      aria-labelledby={heading}
      tabIndex={-1}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: reduced ? 0 : 0.32, ease: [0.32, 0.02, 0.2, 1] }}
    >
      <header>
        <h3 id={heading}>Find your Rashi</h3>
        <button type="button" className="rashi-finder-close" onClick={onClose}>
          <X size={16} aria-hidden="true" />
          <span className="sr-only">Close</span>
        </button>
      </header>
      <p className="rashi-small rashi-finder-lead">
        Enter your date of birth to discover your sign.
      </p>
      <form onSubmit={submit}>
        {/* Three boxes rather than one date input: the native picker is a
            desktop-only affordance, and the grid stays in the panel's own
            compact width. */}
        <div className="rashi-finder-fields">
          <label className="rashi-finder-field">
            <span>Day</span>
            <input
              ref={dayRef}
              type="text"
              inputMode="numeric"
              autoComplete="bday-day"
              placeholder="DD"
              value={day}
              onChange={(event) => {
                const next = digits(event.target.value, 2);
                setDay(next);
                if (next.length === 2) advance(monthRef);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${heading}-error` : undefined}
            />
          </label>
          <label className="rashi-finder-field">
            <span>Month</span>
            <input
              ref={monthRef}
              type="text"
              inputMode="numeric"
              autoComplete="bday-month"
              placeholder="MM"
              value={month}
              onChange={(event) => {
                const next = digits(event.target.value, 2);
                setMonth(next);
                if (next.length === 2) advance(yearRef);
              }}
            />
          </label>
          <label className="rashi-finder-field">
            <span>Year</span>
            <input
              ref={yearRef}
              type="text"
              inputMode="numeric"
              autoComplete="bday-year"
              placeholder="YYYY"
              value={year}
              onChange={(event) => setYear(digits(event.target.value, 4))}
            />
          </label>
        </div>
        <button type="submit" className="rashi-finder-submit">
          Find my Rashi <ArrowRight size={15} aria-hidden="true" />
        </button>
      </form>
      {error && (
        <p className="rashi-finder-error" id={`${heading}-error`} role="alert">
          {error}
        </p>
      )}
      {found && (
        <div className="rashi-finder-result" role="status">
          <p className="rashi-eyebrow">{found.product.name} · {found.product.sanskrit}</p>
          <p>{found.product.intention}</p>
          {found.cusp && (
            <p className="rashi-small">
              Your date falls on a cusp, where two signs meet. Have a look at
              both and choose the one that feels like yours.
            </p>
          )}
          <button
            type="button"
            className="rashi-text-link"
            onClick={() => onPick(found.product.slug)}
          >
            Show {found.product.name} <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
      <p className="rashi-finder-note">{rashiFinderNote}</p>
    </motion.section>
  );
}

// --- quick view ------------------------------------------------------------

function RashiQuickView({
  product,
  onClose,
  compared,
  onCompare,
  compareFull,
}: {
  product: RashiProduct;
  onClose: () => void;
  compared: boolean;
  onCompare: () => void;
  compareFull: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const heading = useId();
  useEscape(true, onClose);
  useScrollLock(true);
  useFocusOnOpen(true, panel);
  return (
    <motion.div
      className="rashi-drawer-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <button
        type="button"
        className="rashi-drawer-scrim"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
      />
      <motion.div
        ref={panel}
        className="rashi-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={heading}
        tabIndex={-1}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.42, ease: [0.32, 0.02, 0.2, 1] }}
      >
        <header className="rashi-drawer-head">
          <p className="rashi-eyebrow">
            <span lang="hi">{product.hindi}</span> · Rashi Rakhi
          </p>
          <button type="button" className="rashi-drawer-close" onClick={onClose}>
            <X size={16} aria-hidden="true" />
            <span className="sr-only">Close quick view</span>
          </button>
        </header>
        <div className="rashi-drawer-photo">
          <img
            src={product.imageLarge}
            srcSet={product.image + " 480w, " + product.imageLarge + " 960w"}
            sizes="(max-width: 700px) 100vw, 420px"
            width={960}
            height={product.landscape ? 540 : 1707}
            alt={
              product.name +
              " Rakhi: beaded woven cord with a zodiac plaque, photographed on ivory cloth"
            }
            decoding="async"
          />
        </div>
        <h3 className="rashi-drawer-name" id={heading}>
          {product.name}
        </h3>
        <p className="rashi-drawer-intention">{product.intention}</p>
        <p className="rashi-drawer-price">
          <strong>₹{product.price}</strong>
          <span>{RASHI_OFFER.label} · per piece</span>
        </p>
        <p className="rashi-small">{product.reflection}</p>
        <div className="rashi-drawer-details">
          <details>
            <summary>Materials &amp; details</summary>
            <p>
              The photograph shows the cord, beads, zodiac plaque and gold-tone
              accents. Stone identities, metal composition and dimensions need
              maker confirmation; colour alone does not verify a gemstone. The
              photograph is not proof of certification.
            </p>
          </details>
          <details>
            <summary>Size &amp; fit</summary>
            <p>
              Ask us for the supported wrist range and cord measurements before
              you order. Do not assume one size fits every wrist.
            </p>
          </details>
          <details>
            <summary>Shipping &amp; returns</summary>
            <p>
              Availability, fit, exact materials and delivery are confirmed
              before you order. These Rakhis are not yet available through
              website checkout.
            </p>
          </details>
        </div>
        <div className="rashi-drawer-actions">
          <Link
            to="/rakhi/rashi/$slug"
            params={{ slug: product.slug }}
            className="rashi-primary"
          >
            View this piece <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <a
            className="rashi-secondary"
            href={rashiEnquiry(product)}
            target="_blank"
            rel="noreferrer"
          >
            Enquire on WhatsApp
          </a>
        </div>
        <button
          type="button"
          className="rashi-compare-toggle is-solo"
          aria-pressed={compared}
          disabled={!compared && compareFull}
          onClick={onCompare}
        >
          <span className="rashi-compare-box" aria-hidden="true" />
          Add to compare
        </button>
      </motion.div>
    </motion.div>
  );
}

// --- compare ---------------------------------------------------------------

function RashiComparePanel({
  items,
  onRemove,
  onClose,
}: {
  items: RashiProduct[];
  onRemove: (slug: string) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const heading = useId();
  useEscape(true, onClose);
  useScrollLock(true);
  useFocusOnOpen(true, panel);
  return (
    <motion.div
      className="rashi-compare-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <button
        type="button"
        className="rashi-drawer-scrim"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
      />
      <motion.div
        ref={panel}
        className="rashi-compare-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={heading}
        tabIndex={-1}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.34, ease: [0.32, 0.02, 0.2, 1] }}
      >
        <header>
          <h3 id={heading}>Compare pieces ({items.length})</h3>
          <button type="button" className="rashi-drawer-close" onClick={onClose}>
            <X size={16} aria-hidden="true" />
            <span className="sr-only">Close comparison</span>
          </button>
        </header>
        {/* Factual rows only: what each piece is, what it is confirmed to be
            made of, and what it costs. Nothing here ranks or scores them. */}
        <table className="rashi-compare-table">
          <caption className="sr-only">
            Factual comparison of the selected Rashi pieces
          </caption>
          <thead>
            <tr>
              <th scope="col">Rashi</th>
              {items.map((item) => (
                <th scope="col" key={item.slug}>
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Design</th>
              {items.map((item) => (
                <td key={item.slug}>{item.intention}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Materials &amp; details</th>
              {items.map((item) => (
                <td key={item.slug}>
                  Woven cord with a {item.name} zodiac plaque and gold-tone
                  accents.
                </td>
              ))}
            </tr>
            {/* The catalogue does not record stone identities or thread colour,
                and colour in a photograph cannot stand in for them, so this row
                says so rather than guessing at one. */}
            <tr>
              <th scope="row">Stones &amp; thread colour</th>
              {items.map((item) => (
                <td key={item.slug}>Confirmed on enquiry</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Price</th>
              {items.map((item) => (
                <td key={item.slug}>
                  ₹{item.price}{" "}
                  <span className="rashi-small">
                    {RASHI_OFFER.label}, confirmed on enquiry
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="rashi-compare-panel-foot">
          <button type="button" className="rashi-text-link" onClick={onClose}>
            Close
          </button>
          <button type="button" className="rashi-compare-clear" onClick={onClose}>
            Clear all
          </button>
        </div>
        <p className="rashi-small">
          Stone identities, metal composition, thread colour, fit and delivery
          are confirmed before you order.
        </p>
        <ul className="sr-only">
          {items.map((item) => (
            <li key={item.slug}>
              <button type="button" onClick={() => onRemove(item.slug)}>
                Remove {item.name} from comparison
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

function RashiCompareTray({
  items,
  onRemove,
  onClear,
  onView,
}: {
  items: RashiProduct[];
  onRemove: (slug: string) => void;
  onClear: () => void;
  onView: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.aside
      className="rashi-compare-tray"
      aria-label="Comparison tray"
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.32, 0.02, 0.2, 1] }}
    >
      <div className="rashi-compare-tray-head">
        <h3 className="rashi-compare-title">
          Compare pieces (<span className="rashi-compare-count">{items.length}</span>)
        </h3>
      </div>
      <ul className="rashi-compare-items">
        {items.map((item) => (
          <li className="rashi-compare-item" key={item.slug}>
            <img src={item.image} alt="" width={480} height={853} loading="lazy" />
            <span>
              <strong>{item.name}</strong>
              <small>{item.intention}</small>
            </span>
            <button
              type="button"
              onClick={() => onRemove(item.slug)}
              aria-label={"Remove " + item.name + " from comparison"}
            >
              <X size={13} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div className="rashi-compare-tray-actions">
        <button
          type="button"
          className="rashi-primary rashi-compare-view"
          onClick={onView}
          disabled={items.length < 2}
        >
          View comparison <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button type="button" className="rashi-compare-clear" onClick={onClear}>
          Clear all
        </button>
      </div>
    </motion.aside>
  );
}

// --- the card --------------------------------------------------------------

export function RashiDiscoveryCard({
  product,
  index,
  compared,
  compareFull,
  onQuickView,
  onCompare,
}: {
  product: RashiProduct;
  index: number;
  compared: boolean;
  compareFull: boolean;
  onQuickView: () => void;
  onCompare: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      className="rashi-product-card"
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: reduced ? 0 : 0.5,
        delay: reduced ? 0 : Math.min(index, 5) * 0.05,
        ease: [0.32, 0.02, 0.2, 1],
      }}
    >
      <div className="rashi-card-photo">
        <Link
          to="/rakhi/rashi/$slug"
          params={{ slug: product.slug }}
          className="rashi-card-photo-link"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={product.image}
            srcSet={product.image + " 480w, " + product.imageLarge + " 960w"}
            sizes="(max-width: 700px) 90vw, (max-width: 1100px) 44vw, 280px"
            width={960}
            height={product.landscape ? 540 : 1707}
            loading={index < 4 ? "eager" : "lazy"}
            decoding="async"
            alt=""
          />
        </Link>
        <span className="rashi-card-glyph" aria-hidden="true">
          {product.symbol}
        </span>
        <button type="button" className="rashi-quickview-trigger" onClick={onQuickView}>
          <span>Quick view</span>
          <ArrowRight size={13} aria-hidden="true" />
          <span className="sr-only">of {product.name}</span>
        </button>
      </div>
      <div className="rashi-card-copy">
        <p className="rashi-small">
          <span lang="hi">{product.hindi}</span> · Rashi Rakhi
        </p>
        <h3>
          <Link
            to="/rakhi/rashi/$slug"
            params={{ slug: product.slug }}
            className="rashi-card-name"
          >
            {product.name}
          </Link>
        </h3>
        <p className="rashi-card-intention">{product.intention}</p>
        <p className="rashi-card-price">
          <strong>₹{product.price}</strong>
          <span>{RASHI_OFFER.label}</span>
        </p>
        <div className="rashi-card-foot">
          <button
            type="button"
            className="rashi-compare-toggle"
            aria-pressed={compared}
            disabled={!compared && compareFull}
            onClick={onCompare}
          >
            <span className="rashi-compare-box" aria-hidden="true" />
            Add to compare
            <span className="sr-only">
              {compared ? " — remove " + product.name : " — " + product.name}
            </span>
          </button>
          <Link
            to="/rakhi/rashi/$slug"
            params={{ slug: product.slug }}
            className="rashi-card-action"
          >
            <span>View this piece</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

// --- the section -----------------------------------------------------------

export function RashiDiscovery({
  sign,
  onSignChange,
}: {
  sign?: string;
  onSignChange: (slug?: string) => void;
}) {
  const reduced = useReducedMotion();
  const [finderOpen, setFinderOpen] = useState(false);
  const [quickView, setQuickView] = useState<RashiProduct | null>(null);
  const [comparePanel, setComparePanel] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);

  const selected = sign ? findRashi(sign) : undefined;
  const index = selected ? rashiCatalogue.indexOf(selected) : -1;
  const products = useMemo(
    () => (selected ? [selected] : rashiCatalogue),
    [selected],
  );
  const compared = useMemo(
    () =>
      compare
        .map((slug) => findRashi(slug))
        .filter((item): item is RashiProduct => Boolean(item)),
    [compare],
  );
  const compareFull = compare.length >= COMPARE_LIMIT;

  const toggleCompare = useCallback((slug: string) => {
    setCompare((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : current.length < COMPARE_LIMIT
          ? [...current, slug]
          : current,
    );
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (!selected) return;
      const next = rashiCatalogue[(index + delta + rashiCatalogue.length) % rashiCatalogue.length];
      onSignChange(next.slug);
    },
    [selected, index, onSignChange],
  );

  // The drawer and the comparison panel are mutually exclusive, and clearing the
  // last piece closes the panel rather than leaving it empty.
  const closeCompareIfEmpty = useCallback(() => {
    setComparePanel((open) => {
      if (open && compare.length < 2) return false;
      return open;
    });
  }, [compare.length]);
  useEffect(closeCompareIfEmpty, [compare, closeCompareIfEmpty]);

  const results = (
    <p role="status" className="rashi-result-count">
      {products.length} {products.length === 1 ? "piece" : "pieces"} · ₹899
      each
    </p>
  );

  return (
    <section
      className="rashi-discovery rashi-container"
      id="rashi-collection"
      aria-labelledby="rashi-heading"
    >
      <div className="rashi-discovery-head">
        <div>
          <p className="rashi-eyebrow">Choose a connection</p>
          <h2 id="rashi-heading">Begin with your sign.</h2>
        </div>
        <div className="rashi-discovery-intro">
          <p>
            Choose a Rashi you know, or simply a design you love. This is a
            collection, not a birth-chart reading.
          </p>
        </div>
      </div>

      <div
        className="rashi-signs"
        id="rashi-signs"
        role="group"
        aria-label="Choose your Rashi"
      >
        <button
          type="button"
          className="rashi-signs-all"
          aria-pressed={!selected}
          onClick={() => onSignChange()}
        >
          <span aria-hidden="true">✧</span>All 12 signs
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
          </button>
        ))}
      </div>

      {/* Out of the pill row and on its own line, so it reads as a second way in
          rather than a thirteenth sign. */}
      <div className="rashi-signs-hint">
        <button
          type="button"
          className="rashi-signs-finder"
          onClick={() => setFinderOpen(true)}
        >
          <span className="rashi-signs-finder-mark">
            <CalendarDays size={17} aria-hidden="true" />
          </span>
          <span className="rashi-signs-finder-text">
            Not sure of your Rashi?
            <ArrowRight size={16} aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* The context line only exists once a sign is chosen, so it never
          explains a selection the visitor has not made. */}
      <AnimatePresence mode="wait" initial={false}>
        {selected && (
          <motion.div
            key={selected.slug}
            className="rashi-context"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduced ? 0 : 0.32, ease: [0.32, 0.02, 0.2, 1] }}
          >
            <span className="rashi-context-glyph" aria-hidden="true">
              {selected.symbol}
            </span>
            <div className="rashi-context-title">
              <h3 className="rashi-context-name">
                {selected.name}
                <span className="rashi-context-sanskrit">{selected.sanskrit}</span>
              </h3>
              <p>{selected.intention}</p>
            </div>
            <p className="rashi-context-note">{selected.reflection}</p>
            <div className="rashi-context-nav">
              <button type="button" onClick={() => step(-1)} aria-label="Previous Rashi">
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span className="rashi-context-count">
                {String(index + 1).padStart(2, "0")} / {rashiCatalogue.length}
              </span>
              <button type="button" onClick={() => step(1)} aria-label="Next Rashi">
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rashi-result-line">{results}</div>

      <div
        className={
          "rashi-product-grid" + (selected ? " is-filtered" : "")
        }
      >
        {products.map((product, position) => (
          <RashiDiscoveryCard
            key={product.slug}
            product={product}
            index={position}
            compared={compare.includes(product.slug)}
            compareFull={compareFull}
            onQuickView={() => setQuickView(product)}
            onCompare={() => toggleCompare(product.slug)}
          />
        ))}
        {/* The finder belongs inside the grid too, so the catalogue ends with a
            way forward rather than a wall. It only makes sense once the whole
            collection is on screen. */}
        {!selected && (
          <motion.button
            type="button"
            className="rashi-finder-cta"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: reduced ? 0 : 0.5,
              delay: reduced ? 0 : 0.15,
              ease: [0.32, 0.02, 0.2, 1],
            }}
            onClick={() => setFinderOpen(true)}
          >
            <span className="rashi-finder-cta-mark">
              <CalendarDays size={24} aria-hidden="true" />
            </span>
            <span className="rashi-finder-cta-title">
              Don't know your Rashi?
            </span>
            <span className="rashi-finder-cta-link">
              Find your Rashi by date of birth
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </motion.button>
        )}
      </div>

      <Overlay>
        <AnimatePresence>
          {finderOpen && (
            <RashiFinder
              key="finder"
              onPick={(slug) => {
                onSignChange(slug);
                setFinderOpen(false);
              }}
              onClose={() => setFinderOpen(false)}
            />
          )}
        </AnimatePresence>
      </Overlay>

      <Overlay>
        <AnimatePresence>
          {quickView && (
            <RashiQuickView
              key={quickView.slug}
              product={quickView}
              onClose={() => setQuickView(null)}
              compared={compare.includes(quickView.slug)}
              compareFull={compareFull}
              onCompare={() => toggleCompare(quickView.slug)}
            />
          )}
        </AnimatePresence>
      </Overlay>

      <Overlay>
        <AnimatePresence>
          {compared.length >= 2 && !quickView && (
            <RashiCompareTray
              key="tray"
              items={compared}
              onRemove={toggleCompare}
              onClear={() => setCompare([])}
              onView={() => setComparePanel(true)}
            />
          )}
        </AnimatePresence>
      </Overlay>

      <Overlay>
        <AnimatePresence>
          {comparePanel && compared.length >= 2 && (
            <RashiComparePanel
              key="panel"
              items={compared}
              onRemove={toggleCompare}
              onClose={() => setComparePanel(false)}
            />
          )}
        </AnimatePresence>
      </Overlay>
    </section>
  );
}