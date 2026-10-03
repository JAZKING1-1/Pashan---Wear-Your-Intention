import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { CataloguePhoto } from "./CataloguePhoto";
import type { Collection } from "@/data/products";
import {
  cardDescriptions,
  productPreviewConfigs,
} from "@/data/bracelet-assets";
import { campaignPhoto } from "@/data/product-photography";
import { locales } from "@/lib/i18n";
import { useAtelierCopy } from "@/data/atelier-copy";
import { useProductViewer } from "./BraceletProductViewer";
import "@/styles-atelier.css";

// Matches styles-collections.css: a refined ease-out with no overshoot.
const CAMPAIGN_EASE = [0.22, 0.61, 0.36, 1] as const;
const CAMPAIGN_STAGGER = 0.07;

export function ProductCard({
  product,
  index = 0,
  campaign = false,
}: {
  product: Collection;
  index?: number;
  /** Collections campaign frame instead of the original studio photograph. */
  campaign?: boolean;
}) {
  const { a, locale } = useAtelierCopy();
  const openViewer = useProductViewer();
  const reduced = useReducedMotion();
  const shot = campaign ? campaignPhoto(product.slug) : undefined;
  // A missing or broken campaign file falls back to the untouched original.
  const [shotFailed, setShotFailed] = useState(false);
  const useShot = Boolean(shot) && !shotFailed;
  const title = product.isCustom ? a("title") : product.stone;
  const money = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  const cardProps = campaign
    ? ({
        initial: reduced ? { opacity: 0 } : { opacity: 0, y: 16 },
        whileInView: reduced ? { opacity: 1 } : { opacity: 1, y: 0 },
        transition: reduced
          ? { duration: 0.3, delay: 0 }
          : {
              duration: 0.5,
              delay: Math.min(index, 7) * CAMPAIGN_STAGGER,
              ease: CAMPAIGN_EASE,
            },
        viewport: { once: true, amount: 0.15 },
      } as const)
    : {};

  return (
    <motion.article
      className={`atelier-card${campaign ? " is-campaign" : ""}`}
      data-product={product.slug}
      {...cardProps}
    >
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="atelier-card-image"
        aria-label={title}
      >
        {useShot && shot ? (
          <img
            className="atelier-card-campaign-image"
            src={shot.src}
            srcSet={shot.srcSet}
            sizes="(max-width:350px) 92vw, (max-width:760px) 46vw, (max-width:1099px) 44vw, (max-width:1279px) 30vw, 400px"
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            loading={index < 4 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
            onError={() => setShotFailed(true)}
          />
        ) : (
          <CataloguePhoto slug={product.slug} />
        )}
      </Link>
      <div className="atelier-card-body">
        <span className="atelier-card-category" lang="en" dir="ltr">
          {product.isCustom ? "The making table" : "Natural stone bracelet"}
        </span>
        <h3>
          <Link to="/products/$slug" params={{ slug: product.slug }}>
            {title}
          </Link>
        </h3>
        <p>
          {cardDescriptions[product.slug]?.[
            locales.findIndex(([id]) => id === locale)
          ] ?? product.subtitle}
        </p>
        {product.isCustom && (
          <p className="atelier-photo-caption">
            Existing mixed-stone piece shown for inspiration. Your design is
            composed in the making table.
          </p>
        )}
        <div className="atelier-card-price">
          <span>{money(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <del>{money(product.compareAtPrice)}</del>
          )}
        </div>
        <div className="atelier-card-actions">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="atelier-card-action atelier-card-primary"
          >
            {a(product.isCustom ? "create" : "explore")}
            <span className="atelier-card-arrow" aria-hidden>
              {" →"}
            </span>
          </Link>
          <button
            className="atelier-card-action"
            onClick={(e) => openViewer(product, e.currentTarget)}
          >
            {a(productPreviewConfigs[product.slug] ? "view3d" : "photos")}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
