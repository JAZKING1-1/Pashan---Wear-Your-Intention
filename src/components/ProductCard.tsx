import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  index = 0,
}: {
  product: Collection;
  index?: number;
}) {
  const { a, locale } = useAtelierCopy();
  const openViewer = useProductViewer();
  const imageRef = useRef<HTMLImageElement>(null);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const image = imageRef.current;
    setFallback(Boolean(image?.complete && !image.naturalWidth));
  }, [product.slug]);
  const title = product.isCustom ? a("title") : product.stone;
  const photo = `/atelier-products/${product.slug}-720.webp`;
  const photoWidth =
    product.slug === "tiger-eye"
      ? 560
      : product.slug === "amethyst"
        ? 620
        : product.slug === "lava"
          ? 660
          : 720;
  const photoHeight = product.isCustom
    ? 720
    : product.slug === "dhan-yog"
      ? 900
      : (photoWidth * 3) / 4;
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
        <img
          ref={imageRef}
          data-fallback={fallback ? "true" : undefined}
          src={fallback ? product.image : photo}
          srcSet={
            fallback
              ? undefined
              : `/atelier-products/${product.slug}-480.webp 480w, /atelier-products/${product.slug}-720.webp ${photoWidth}w`
          }
          sizes="(max-width:760px) calc(100vw - 40px), (max-width:1000px) 45vw, 30vw"
          alt={title}
          loading={index < 2 ? "eager" : "lazy"}
          decoding="async"
          width={photoWidth}
          height={photoHeight}
          onError={() => setFallback(true)}
        />
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
