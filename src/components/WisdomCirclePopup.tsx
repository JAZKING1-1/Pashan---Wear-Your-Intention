import { Gift, Mail, Sparkles, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useCart } from "@/lib/cart";
import {
  BASKET_OFFER_CODE,
  BASKET_OFFER_MINIMUM,
  WELCOME_OFFER_CODE,
} from "@/lib/offers";
import { PashanSymbol } from "./BrandMark";
import { subscribeToNewsletter } from "@/lib/newsletter.server";


const SESSION_KEY = "pashan-wisdom-circle-seen-v3";

export function WisdomCirclePopup() {
  const { applyOffer } = useCart();
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
    setVisible(false);
    window.setTimeout(() => previousFocus.current?.focus(), 0);
  }, []);

  useEffect(() => {
    let hasSeen = false;
    try {
      hasSeen = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
    if (hasSeen || window.location.pathname === "/checkout") return;

    const timer = window.setTimeout(() => {
      previousFocus.current = document.activeElement as HTMLElement | null;
      setVisible(true);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (window.matchMedia("(min-width: 781px)").matches) {
      emailRef.current?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, visible]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const hp = String(formData.get("b_website_hp") || "");

    if (!email) return;

    setLoading(true);
    try {
      await subscribeToNewsletter({
        data: {
          email,
          source: "wisdom_circle_popup",
          b_website_hp: hp,
        },
      });
      const result = applyOffer(WELCOME_OFFER_CODE);
      setSubmitted(result.success);
      setMessage(result.message || "Welcome offer unlocked!");
    } catch (err: any) {
      console.error("[WisdomCircle Signup Error]:", err);
      // Still unlock locally for optimal user experience
      const result = applyOffer(WELCOME_OFFER_CODE);
      setSubmitted(result.success);
      setMessage(result.message);
    } finally {
      setLoading(false);
    }
  };



  const useBasketOffer = () => {
    const result = applyOffer(BASKET_OFFER_CODE);
    setMessage(result.message);
  };

  if (!visible) return null;

  return (
    <div className="wisdom-popup-overlay" role="presentation">
      <section
        className="wisdom-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wisdom-popup-title"
        aria-describedby="wisdom-popup-description"
      >
        <button
          type="button"
          className="wisdom-popup-close"
          onClick={close}
          aria-label="Close welcome offer"
          title="Close"
        >
          <X aria-hidden size={20} />
        </button>

        <div className="wisdom-popup-story">
          <PashanSymbol />
          <span>Ancient wisdom for modern days</span>
          <h2 id="wisdom-popup-title">
            A steadier note for the life you are living.
          </h2>
          <p id="wisdom-popup-description">
            Join our daily note for grounding rituals, natural-stone traditions,
            and practical ways to carry older wisdom into busy modern days.
          </p>
          <small>
            Reflective wellbeing guidance only. No medical or supernatural
            claims.
          </small>
        </div>

        <div className="wisdom-popup-offer">
          <div className="wisdom-offer-kicker">
            <Sparkles aria-hidden size={16} /> Opening circle offer
          </div>
          <strong>10% off your first order</strong>
          <p>Enter your email to unlock the welcome code in your bag.</p>

          {submitted ? (
            <div className="wisdom-popup-success" role="status">
              <Mail aria-hidden size={20} />
              <div>
                <b>Welcome offer unlocked</b>
                <span>
                  Code <strong>{WELCOME_OFFER_CODE}</strong> is active in your
                  bag.
                </span>
              </div>
            </div>
          ) : (
            <form className="wisdom-popup-form" onSubmit={handleSubmit}>
              {/* Invisible Honeypot Field for Bot Defense */}
              <input
                type="text"
                name="b_website_hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ display: "none" }}
              />
              <label htmlFor="wisdom-email">Email address</label>
              <div>
                <input
                  ref={emailRef}
                  id="wisdom-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  placeholder="you@example.com"
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Unlocking..." : "Unlock 10% off"}
                </button>
              </div>
            </form>

          )}

          <div className="wisdom-basket-offer">
            <Gift aria-hidden size={22} />
            <div>
              <b>Planning a larger order?</b>
              <span>
                Save ₹200 on orders of ₹
                {BASKET_OFFER_MINIMUM.toLocaleString("en-IN")} or more with code{" "}
                {BASKET_OFFER_CODE}.
              </span>
            </div>
            <button type="button" onClick={useBasketOffer}>
              Use this offer
            </button>
          </div>

          {message && !submitted ? (
            <p className="wisdom-offer-message" role="status">
              {message}
            </p>
          ) : null}

          <button type="button" className="wisdom-popup-later" onClick={close}>
            Maybe later
          </button>
        </div>
      </section>
    </div>
  );
}
