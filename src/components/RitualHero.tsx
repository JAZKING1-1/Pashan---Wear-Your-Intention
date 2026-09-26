import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, Compass, Gift } from "lucide-react";
import { ritualKit } from "@/data/ritual-kit";
import { useI18n } from "@/lib/i18n";
import { OpeningRitual } from "./OpeningRitual";
import {
  cataloguePhotos,
  originalPhotoSrcSet,
} from "@/data/product-photography";
import "@/styles-ritual.css";

export function RitualHero() {
  const { t, locale } = useI18n();
  const heroPhoto = cataloguePhotos("tiger-eye");
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
            {t("headline")}
          </h1>
          <p className="ritual-hero-lede">
            A meaningful piece. A thoughtful unboxing. A little more intention
            in the everyday.
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
          image={heroPhoto.image}
          srcSet={originalPhotoSrcSet(heroPhoto.image)}
          imageHeight={1707}
          photoFit="cover"
          productSlug="tiger-eye"
          alt={heroPhoto.imageAlts[0]}
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
