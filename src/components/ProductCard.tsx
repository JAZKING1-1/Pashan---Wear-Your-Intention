import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { Collection } from "@/data/products";
import { LaunchPrice } from "./LaunchPrice";

export function ProductCard({
  product,
  index = 0,
}: {
  product: Collection;
  index?: number;
}) {
  const secondary =
    product.images[Math.max(0, product.images.length - 2)] ?? product.image;

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className={`product-card group ${product.isCustom ? "is-custom" : ""} stone-env-${product.slug}`}
    >
      <div className="product-card-media pulse-animation">
        <div className="product-card-aura" style={{ background: 'var(--stone-aura)' }} />
        <div className="product-card-env" style={{ background: 'var(--stone-bg)' }} />
        <img
          src={product.image}
          alt={`${product.stone} bracelet`}
          loading={index < 4 ? "eager" : "lazy"}
          className="product-card-primary"
        />
        <img
          src={secondary}
          alt=""
          loading="lazy"
          aria-hidden
          className="product-card-secondary"
        />
        <div className="product-card-shade" />
        <div className="product-card-index">
          No. {String(index + 1).padStart(2, "0")}
        </div>
        {product.badge && (
          <div className="product-card-badge">{product.badge}</div>
        )}
        <div className="product-card-view">
          View piece <ArrowUpRight aria-hidden size={15} />
        </div>
      </div>
      <div className="product-card-copy">
        <div>
          <div className="product-card-collection">{product.name}</div>
          <h3>{product.stone}</h3>
          <p>{product.qualities.slice(0, 3).join(" / ")}</p>
        </div>
        <div className="product-card-meta">
          <span className="product-card-fit">
            {product.isCustom ? "Free size · custom" : product.fit}
          </span>
          <div className="product-card-price">
            <LaunchPrice
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              compact
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
