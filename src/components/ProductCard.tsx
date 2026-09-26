import { Link } from "@tanstack/react-router";
import { CataloguePhoto } from "./CataloguePhoto";
import type { Collection } from "@/data/products";
import {
  cardDescriptions,
  productPreviewConfigs,
} from "@/data/bracelet-assets";
import { locales } from "@/lib/i18n";
import { useAtelierCopy } from "@/data/atelier-copy";
import { useProductViewer } from "./BraceletProductViewer";
import "@/styles-atelier.css";
export function ProductCard({
  product,
}: {
  product: Collection;
  index?: number;
}) {
  const { a, locale } = useAtelierCopy();
  const openViewer = useProductViewer();
  const title = product.isCustom ? a("title") : product.stone;
  const money = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  return (
    <article className="atelier-card" data-product={product.slug}>
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="atelier-card-image"
        aria-label={title}
      >
        <CataloguePhoto slug={product.slug} />
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
            {a(product.isCustom ? "create" : "explore")} →
          </Link>
          <button
            className="atelier-card-action"
            onClick={(e) => openViewer(product, e.currentTarget)}
          >
            {a(productPreviewConfigs[product.slug] ? "view3d" : "photos")}
          </button>
        </div>
      </div>
    </article>
  );
}
