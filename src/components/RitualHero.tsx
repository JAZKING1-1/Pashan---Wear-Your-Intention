import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownRight, Check, Gift } from "lucide-react";
import { ritualKit } from "@/data/ritual-kit";
import { useI18n } from "@/lib/i18n";
import { IntentionFormation } from "./IntentionFormation";
import "@/styles-ritual.css";

const atmospheres = [
  { key: "calm", label: "Calm", note: "Soft ivory. A little room to breathe." },
  {
    key: "inspiration",
    label: "Inspiration",
    note: "Warm copper. A spark for your next idea.",
  },
  {
    key: "joy",
    label: "Joy",
    note: "Sunlit orange. Joy in the little things.",
  },
] as const;

export function RitualHero() {
  const { t, locale } = useI18n();
  const [atmosphere, setAtmosphere] =
    useState<(typeof atmospheres)[number]["key"]>("calm");
  return (
    <section
      className="ritual-hero"
      data-atmosphere={atmosphere}
      aria-labelledby="ritual-hero-title"
      lang="en"
      dir="ltr"
    >
      <div className="ritual-container ritual-hero-grid">
        <div className="ritual-hero-copy">
          <p className="ritual-kicker">NATURAL STONES · MEANINGFUL RITUALS · HARIDWAR</p>
          <a className="ritual-hero-kit" href="#ritual-kit">
            <Gift size={20} aria-hidden="true" />
            <span>{ritualKit.headline}</span>
            <ArrowDownRight size={18} aria-hidden="true" />
          </a>
          <h1
            id="ritual-hero-title"
            lang={locale}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            WEAR YOUR INTENTION.
          </h1>
          <p className="ritual-hero-lede">
            Natural stone bracelets made to be a daily reminder of what you choose to embody.
          </p>
          <div className="ritual-hero-actions">
            <Link
              to="/find-your-bracelet"
              className="ritual-button ritual-button-saffron"
            >
              FIND YOUR BRACELET →
            </Link>
            <Link
              to="/collections"
              className="ritual-button ritual-button-outline"
            >
              SHOP COLLECTIONS →
            </Link>
          </div>
        </div>
        <div className="ritual-scene">
          <div className="ritual-scene-halo" aria-hidden="true" />
          <IntentionFormation productSlug="tiger-eye" />
          <div className="ritual-atmosphere">
            <p className="ritual-atmosphere-label">Make yourself at home</p>
            <div
              className="ritual-atmosphere-options"
              role="group"
              aria-label="Choose the atmosphere"
            >
              {atmospheres.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  aria-pressed={atmosphere === option.key}
                  onClick={() => setAtmosphere(option.key)}
                >
                  <span
                    className={`ritual-atmosphere-swatch swatch-${option.key}`}
                    aria-hidden="true"
                  >
                    {atmosphere === option.key && (
                      <Check size={12} strokeWidth={3} />
                    )}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
            <p className="ritual-atmosphere-note" role="status">
              {atmospheres.find((option) => option.key === atmosphere)?.note}
            </p>
          </div>
        </div>
      </div>
      <div className="ritual-threshold">
        <span>Stone</span>
        <i aria-hidden="true" />
        <span>Symbol</span>
        <i aria-hidden="true" />
        <span>Intention</span>
      </div>
    </section>
  );
}
