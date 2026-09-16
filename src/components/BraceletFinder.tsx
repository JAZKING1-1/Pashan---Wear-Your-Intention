import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { collections } from "@/data/products";
import type { Collection } from "@/data/products";
import {
  FINDER_SESSION_KEY,
  FINDER_VERSION,
  finderAnswerLabel,
  finderSteps,
  parseFinderAnswers,
  parseFinderSession,
  recommendBracelets,
} from "@/lib/bracelet-finder";
import type { FinderDraft } from "@/lib/bracelet-finder";
import "@/styles-finder.css";

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function FinderSeal({ completed }: { completed: number }) {
  return (
    <svg
      className="ritual-finder-seal"
      viewBox="0 0 240 240"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="120" cy="120" r="106" />
      <circle cx="120" cy="120" r="98" strokeDasharray="1 8" />
      <g
        className="ritual-finder-petals"
        style={{ transform: `rotate(${completed * 30}deg)` }}
      >
        {Array.from({ length: 12 }, (_, index) => (
          <path
            key={index}
            d="M120 41 Q101 67 120 85 Q139 67 120 41Z"
            transform={`rotate(${index * 30} 120 120)`}
          />
        ))}
      </g>
      <circle cx="120" cy="120" r="27" />
      <path d="M109 126 Q100 110 120 98 Q140 110 131 126 Q122 141 109 126Z" />
      <path d="M120 111 V135 M110 136 H130" />
      {[0, 1, 2, 3].map((index) => (
        <circle
          key={index}
          cx="120"
          cy="14"
          r="5"
          transform={`rotate(${index * 90} 120 120)`}
          className={index < completed ? "is-complete" : ""}
        />
      ))}
    </svg>
  );
}

function FinderProductImage({ product }: { product: Collection }) {
  const [fallback, setFallback] = useState(false);
  return (
    <img
      src={
        fallback ? product.image : `/atelier-products/${product.slug}-480.webp`
      }
      alt={`${product.stone} bracelet`}
      width="480"
      height="360"
      decoding="async"
      loading="lazy"
      onError={() => setFallback(true)}
    />
  );
}

export function BraceletFinder() {
  const [answers, setAnswers] = useState<FinderDraft>({});
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [notice, setNotice] = useState("");
  const focusAfterStep = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const result = recommendBracelets(answers, collections);
  const question = finderSteps[step];
  const showingResults = step === finderSteps.length;
  const completed = finderSteps.filter((item) => answers[item.key]).length;

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(FINDER_SESSION_KEY);
      const saved = parseFinderSession(stored);
      if (saved) {
        setAnswers(saved.answers);
        setStep(saved.step);
        setNotice("Your choices from this tab have been restored.");
      } else if (stored) {
        window.sessionStorage.removeItem(FINDER_SESSION_KEY);
        setNotice(
          "The previous finder session could not be restored. Please begin again.",
        );
      }
    } catch {
      setStorageAvailable(false);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !storageAvailable) return;
    try {
      if (Object.keys(answers).length === 0)
        window.sessionStorage.removeItem(FINDER_SESSION_KEY);
      else
        window.sessionStorage.setItem(
          FINDER_SESSION_KEY,
          JSON.stringify({ version: FINDER_VERSION, answers, step }),
        );
    } catch {
      setStorageAvailable(false);
    }
  }, [answers, step, loaded, storageAvailable]);

  useEffect(() => {
    if (focusAfterStep.current) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
      focusAfterStep.current = false;
    }
  }, [step]);

  function goToStep(next: number) {
    focusAfterStep.current = true;
    setStep(next);
    setNotice(
      next === finderSteps.length
        ? "Your recommendations are ready."
        : `Step ${next + 1} of 4: ${finderSteps[next].name}.`,
    );
  }

  function choose(value: string) {
    if (!question) return;
    const next = parseFinderAnswers({ ...answers, [question.key]: value });
    if (!next) return;
    setAnswers(next);
    setNotice(
      `${finderAnswerLabel(question.key, value)} selected. Continue when you are ready.`,
    );
  }

  function restart() {
    setAnswers({});
    if (step === 0) heading.current?.focus();
    else goToStep(0);
    try {
      window.sessionStorage.removeItem(FINDER_SESSION_KEY);
      setNotice("Choices cleared. A new beginning.");
    } catch {
      setStorageAvailable(false);
      setNotice(
        "Choices cleared for this view. This browser could not clear its saved session.",
      );
    }
  }

  return (
    <div
      className="ritual-finder"
      lang="en"
      dir="ltr"
      data-finder-ready={loaded}
    >
      <div className="ritual-finder-shell">
        <header className="ritual-finder-intro">
          <p className="ritual-finder-eyebrow">The PASHAN stone guide</p>
          <h1>
            A small ritual.
            <br />
            <em>A personal choice.</em>
          </h1>
          <p>
            Four considered choices to find a bracelet you will want to carry.
            Begin with what matters to you.
          </p>
          <FinderSeal completed={completed} />
          <p className="ritual-finder-philosophy">
            The meaning is a reminder.
            <br />
            The direction is yours.
          </p>
        </header>

        <section
          className="ritual-finder-workspace"
          aria-label="Bracelet finder"
        >
          <ol className="ritual-finder-steps" aria-label="Your progress">
            {finderSteps.map((item, index) => (
              <li
                key={item.key}
                aria-current={step === index ? "step" : undefined}
                data-complete={Boolean(answers[item.key])}
              >
                <button
                  type="button"
                  disabled={!loaded || (index > step && !answers[item.key])}
                  onClick={() => goToStep(index)}
                  aria-label={`${index + 1}. ${item.name}${answers[item.key] ? `: ${finderAnswerLabel(item.key, answers[item.key])}. Edit` : ""}`}
                >
                  <span className="ritual-finder-step-number">
                    {answers[item.key] && index !== step ? (
                      <Check size={15} aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="ritual-finder-panel" key={step}>
            <p className="ritual-finder-eyebrow">
              {showingResults
                ? "Your considered shortlist"
                : `Step ${step + 1} of 4`}
            </p>
            <h2 ref={heading} tabIndex={-1} id="finder-question">
              {showingResults
                ? result.status === "ready"
                  ? "A few stones to sit with."
                  : "Let’s keep your budget."
                : question.title}
            </h2>
            {!showingResults ? (
              <>
                <p id="finder-guidance" className="ritual-finder-guidance">
                  {question.description}
                </p>
                <div
                  className={`ritual-finder-options ritual-finder-options--${question.key}`}
                  role="group"
                  aria-labelledby="finder-question"
                  aria-describedby="finder-guidance"
                >
                  {question.options.map((option) => (
                    <button
                      type="button"
                      key={option.key}
                      disabled={!loaded}
                      className="ritual-finder-option"
                      aria-pressed={answers[question.key] === option.key}
                      onClick={() => choose(option.key)}
                    >
                      {question.key === "palette" ? (
                        <span
                          className={`ritual-finder-swatch ritual-finder-swatch--${option.key}`}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className="ritual-finder-option-copy">
                        <strong>{option.label}</strong>
                        <span>{option.detail}</span>
                      </span>
                      <span
                        className="ritual-finder-choice-mark"
                        aria-hidden="true"
                      >
                        {answers[question.key] === option.key ? (
                          <Check size={16} />
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="ritual-finder-actions">
                  {step > 0 ? (
                    <button
                      type="button"
                      className="ritual-finder-back"
                      onClick={() => goToStep(step - 1)}
                    >
                      <ArrowLeft size={17} aria-hidden="true" /> Back
                    </button>
                  ) : (
                    <span className="ritual-finder-choice-help">
                      Choose one to continue
                    </span>
                  )}
                  <button
                    type="button"
                    className="ritual-finder-primary"
                    disabled={!loaded || !answers[question.key]}
                    onClick={() => goToStep(step + 1)}
                  >
                    {step === 3 ? "Find my bracelet" : "Continue"}
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="ritual-finder-guidance">
                  {result.status === "ready"
                    ? "Chosen from the current ready-made collection. Compare the reasons and let your own eye decide."
                    : "No current bracelet fits these choices within your budget. You do not need to spend more to carry an intention."}
                </p>
                <div
                  className="ritual-finder-answer-summary"
                  aria-label="Your choices. Select any to edit."
                >
                  {finderSteps.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => goToStep(index)}
                    >
                      <span>{item.name}</span>
                      {finderAnswerLabel(item.key, answers[item.key])}
                      <span className="ritual-finder-edit">Edit</span>
                    </button>
                  ))}
                </div>
                {result.status === "ready" ? (
                  <div className="ritual-finder-results">
                    {result.matches.map(({ product, reasons }, index) => (
                      <article
                        key={product.slug}
                        className="ritual-finder-result"
                        data-finder-product={product.slug}
                      >
                        <Link
                          to="/products/$slug"
                          params={{ slug: product.slug }}
                          className="ritual-finder-result-image"
                          aria-label={`Explore ${product.stone}`}
                        >
                          <FinderProductImage product={product} />
                        </Link>
                        <div className="ritual-finder-result-body">
                          <p className="ritual-finder-eyebrow">
                            {index === 0 ? "Begin here" : "Another direction"}
                          </p>
                          <div className="ritual-finder-result-title">
                            <h3>
                              <Link
                                to="/products/$slug"
                                params={{ slug: product.slug }}
                              >
                                {product.stone}
                              </Link>
                            </h3>
                            <span>{money(product.price)}</span>
                          </div>
                          <ul>
                            {reasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                          <Link
                            to="/products/$slug"
                            params={{ slug: product.slug }}
                            className="ritual-finder-result-link"
                          >
                            Explore this bracelet{" "}
                            <ArrowRight size={17} aria-hidden="true" />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="ritual-finder-empty">
                    <p>
                      {result.lowestPrice !== null
                        ? `The current ready-made collection begins at ${money(result.lowestPrice)}.`
                        : "There are no eligible ready-made pieces in the current catalogue."}
                    </p>
                    <button
                      type="button"
                      className="ritual-finder-primary"
                      onClick={() => goToStep(3)}
                    >
                      Review budget <ArrowRight size={17} aria-hidden="true" />
                    </button>
                    <Link to="/collections">
                      Browse the collection without a recommendation
                    </Link>
                  </div>
                )}
                <details className="ritual-finder-method">
                  <summary>How these suggestions are chosen</summary>
                  <p>
                    This is a curated guide, not an AI reading or a diagnosis.
                    Catalogue qualities linked to your intention carry the most
                    weight (8 points each, up to 24), followed by colour (5) and
                    wearing style (3). Your budget is a strict limit. Ties use a
                    fixed alphabetical product order. We show up to three
                    matching ready-made pieces.
                  </p>
                  <p>
                    Stone meanings are cultural and personal symbolism, not
                    promises of health, luck, protection or wealth. This guide
                    does not determine wrist fit, stock or delivery. Check those
                    details before ordering.
                  </p>
                </details>
              </>
            )}
          </div>
          <div className="ritual-finder-session">
            <p>
              {storageAvailable
                ? "Choices stay in this browser tab for this session. No account, birth details or tracking required."
                : "This browser could not save your choices. You can still use the guide; refreshing may lose recent choices."}
            </p>
            <button type="button" disabled={!completed} onClick={restart}>
              <RotateCcw size={15} aria-hidden="true" /> Start again
            </button>
          </div>
          <p
            className="ritual-finder-sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {notice}
          </p>
        </section>
      </div>
    </div>
  );
}
