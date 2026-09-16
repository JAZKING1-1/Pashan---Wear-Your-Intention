import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { OpeningRitual } from "./OpeningRitual";
import heroImage from "@/assets/editorial/tiger-eye-wood.jpg";
import "@/styles-ritual.css";

export function RitualHero() {
  const { t, locale } = useI18n();
  return (
    <section
      className="ritual-hero"
      aria-labelledby="ritual-hero-title"
      lang="en"
      dir="ltr"
    >
      <div className="ritual-container ritual-hero-grid">
        <div className="ritual-hero-copy">
          <p className="ritual-kicker">The PASHAN atelier · Haridwar</p>
          <h1
            id="ritual-hero-title"
            lang={locale}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {t("headline")}
          </h1>
          <p className="ritual-hero-lede">
            A quiet ritual. A meaningful object. A little more intention in the
            everyday.
          </p>
          <div className="ritual-hero-actions">
            <Link
              to="/find-your-bracelet"
              className="ritual-button ritual-button-saffron"
            >
              <Compass size={18} aria-hidden="true" />
              Find my bracelet <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              to="/collections"
              className="ritual-button ritual-button-outline"
              lang={locale}
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              {t("shopCta")}
            </Link>
          </div>
          <p className="ritual-hero-caption">
            Four choices. A considered recommendation.
            <br />
            No birth details. No promises of magic.
          </p>
        </div>
        <OpeningRitual
          image={heroImage}
          alt="PASHAN Tiger Eye bracelet on a warm wood surface"
        />
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
