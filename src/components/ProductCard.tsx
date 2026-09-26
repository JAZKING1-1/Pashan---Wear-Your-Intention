import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  originalPhotoDimensions,
  originalPhotoSrcSet,
} from "@/data/product-photography";
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
  const [photoFailure, setPhotoFailure] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const photo = photoFailure
    ? (product.images[1] ?? product.image)
    : product.image;
  useEffect(() => {
    // An SSR image can fail before React attaches its error handler.
    const image = imageRef.current;
    if (image?.complete && image.currentSrc && !image.naturalWidth)
      setPhotoFailure((value) => Math.min(2, value + 1));
  }, [photo]);
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
        {photoFailure < 2 ? (
          <img
            ref={imageRef}
            src={photo}
            srcSet={photoFailure ? undefined : originalPhotoSrcSet(photo)}
            data-fallback={photoFailure ? "true" : undefined}
            sizes="(max-width:760px) calc(100vw - 40px), (max-width:1000px) 45vw, 30vw"
            alt={
              product.imageAlts[photoFailure && product.images[1] ? 1 : 0] ??
              title
            }
            loading="lazy"
            decoding="async"
            {...originalPhotoDimensions(photo)}
            onError={() => setPhotoFailure((value) => Math.min(2, value + 1))}
          />
        ) : (
          <span className="atelier-photo-unavailable">
            Photograph unavailable. View {title} details →
          </span>
        )}
      </Link>
      <div className="atelier-card-body">
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
