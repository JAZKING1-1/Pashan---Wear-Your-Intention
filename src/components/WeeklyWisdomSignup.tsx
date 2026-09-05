import { Mail, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart";
import { WELCOME_OFFER_CODE } from "@/lib/offers";

type WeeklyWisdomSignupProps = {
  compact?: boolean;
};

export function WeeklyWisdomSignup({
  compact = false,
}: WeeklyWisdomSignupProps) {
  const { applyOffer } = useCart();
  const [joined, setJoined] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("weekly-email");
    try {
      window.localStorage.setItem("pashan-weekly-wisdom-email", String(email));
    } catch {
      // The signup still works when browser storage is unavailable.
    }
    applyOffer(WELCOME_OFFER_CODE);
    setJoined(true);
  };

  return (
    <section
      className={`weekly-wisdom ${compact ? "is-compact" : ""}`}
      aria-labelledby={
        compact ? "weekly-wisdom-contact" : "weekly-wisdom-about"
      }
    >
      <div className="weekly-wisdom-mark" aria-hidden>
        <Sparkles />
      </div>
      <div className="weekly-wisdom-copy">
        <span>Weekly PASHAN note</span>
        <h2 id={compact ? "weekly-wisdom-contact" : "weekly-wisdom-about"}>
          A calmer thought for busy modern days.
        </h2>
        <p>
          One thoughtful email each week with grounded rituals, natural-stone
          traditions, and useful ways to meet stress with more steadiness.
        </p>
      </div>
      {joined ? (
        <div className="weekly-wisdom-success" role="status">
          <Mail aria-hidden />
          <div>
            <strong>You are in the circle.</strong>
            <span>Your 10% welcome offer is active in your bag.</span>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="weekly-wisdom-form">
          <label
            htmlFor={compact ? "weekly-email-contact" : "weekly-email-about"}
          >
            Email address
          </label>
          <div>
            <input
              id={compact ? "weekly-email-contact" : "weekly-email-about"}
              name="weekly-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
            <button type="submit">Join weekly note</button>
          </div>
          <small>Includes 10% off your first order. Unsubscribe anytime.</small>
        </form>
      )}
    </section>
  );
}
