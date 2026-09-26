import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { BraceletComposer } from "@/components/BraceletComposer";
import { SiteLayout } from "@/components/SiteLayout";
import { PeacockGlyph } from "@/components/BrandMark";
import { ProductCard } from "@/components/ProductCard";
import { LaunchPrice } from "@/components/LaunchPrice";
import { collections, getCollection } from "@/data/products";
import { ritualKit } from "@/data/ritual-kit";
import {
  originalPhotoDimensions,
  originalPhotoSrcSet,
} from "@/data/product-photography";
import { formatPrice, useCart } from "@/lib/cart";
import "@/styles-product-detail.css";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getCollection(params.slug);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: loaderData.isCustom
              ? `${loaderData.title} — PASHAN`
              : `${loaderData.stone} Bracelet — PASHAN`,
          },
          {
            name: "description",
            content: `${loaderData.subtitle}. ${loaderData.intention}`,
          },
          {
            property: "og:title",
            content: loaderData.isCustom
              ? `${loaderData.title} — PASHAN`
              : `${loaderData.stone} Bracelet — PASHAN`,
          },
          { property: "og:description", content: loaderData.intention },
          { property: "og:image", content: loaderData.image },
        ]
      : [{ title: "Product — PASHAN" }],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-luxe empty-page">
        <div className="eyebrow">Not found</div>
        <h1>This stone has moved.</h1>
        <Link to="/collections" className="btn-gold">
          Return to the collection
        </Link>
      </div>
    </SiteLayout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();
  const { add } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [openPanel, setOpenPanel] = useState<
    "story" | "details" | "care" | null
  >("story");
  const related = collections
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);
  const galleryIndex = Math.min(selectedImage, product.images.length - 1);
  const galleryImage = product.images[galleryIndex];

  useEffect(() => {
    setSelectedImage(0);
  }, [product.slug]);

  const moveImage = (direction: -1 | 1) => {
    setSelectedImage(
      (index) =>
        (index + direction + product.images.length) % product.images.length,
    );
  };

  const canPurchase = !product.isCustom;

  const addToBag = () => {
    if (!canPurchase) return;

    add(
      {
        slug: product.slug,
        name: product.title,
        stone: `${product.stone} - ${product.fit}`,
        price: product.price,
        image: product.image,
      },
      qty,
    );
  };

  if (product.isCustom)
    return (
      <SiteLayout>
        <main className="atelier-page">
          <BraceletComposer key={product.slug} product={product} />
          <section
            className="ritual-kit-summary container-luxe"
            aria-labelledby="custom-ritual-kit-title"
          >
            <p className="eyebrow">{ritualKit.shortLabel}</p>
            <h2 id="custom-ritual-kit-title">{ritualKit.headline}</h2>
            <p>{ritualKit.summary}</p>
            <Link to="/" hash="ritual-kit" className="text-link">
              See the ritual kit →
            </Link>
          </section>
        </main>
      </SiteLayout>
    );

  return (
    <SiteLayout>
      <div className="product-detail">
        <nav
          className="product-breadcrumb container-luxe"
          aria-label="Breadcrumb"
        >
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/collections">Bracelets</Link>
          <span>/</span>
          <strong>{product.stone}</strong>
        </nav>

        <section className="product-stage container-luxe">
          <div className="product-gallery">
            <div className="product-gallery-main">
              <img
                key={galleryImage}
                src={galleryImage}
                srcSet={originalPhotoSrcSet(galleryImage)}
                sizes="(max-width: 759px) calc(100vw - 40px), (max-width: 1279px) 46vw, 580px"
                {...originalPhotoDimensions(galleryImage)}
                decoding="async"
                fetchPriority="high"
                alt={
                  product.imageAlts[galleryIndex] ??
                  `${product.stone} bracelet view ${galleryIndex + 1}`
                }
                className="product-gallery-slide"
              />
            </div>
            <div className="product-gallery-toolbar">
              <span className="product-gallery-count" aria-live="polite">
                Photo {String(galleryIndex + 1).padStart(2, "0")} /{" "}
                {String(product.images.length).padStart(2, "0")}
              </span>
              {product.images.length > 1 && (
                <div className="product-gallery-arrows">
                  <button
                    type="button"
                    onClick={() => moveImage(-1)}
                    aria-label={`Previous ${product.stone} image`}
                  >
                    <ChevronLeft aria-hidden size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(1)}
                    aria-label={`Next ${product.stone} image`}
                  >
                    <ChevronRight aria-hidden size={22} />
                  </button>
                </div>
              )}
            </div>
            <div
              className="product-thumbnails"
              role="group"
              aria-label="Product images"
            >
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={galleryIndex === index ? "is-active" : ""}
                  aria-pressed={galleryIndex === index}
                  aria-label={`Show ${product.stone} photograph ${index + 1}`}
                >
                  <img
                    src={image.replace("-960.webp", "-480.webp")}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width="80"
                    height="80"
                  />
                  <span className="product-thumbnail-label" aria-hidden="true">
                    {galleryIndex === index ? <Check size={12} /> : index + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <aside className="product-purchase">
            <div className="eyebrow">{product.name} · Natural gemstone</div>
            <h1>
              {product.isCustom ? (
                <>
                  Your custom
                  <br />
                  <em>bracelet</em>
                </>
              ) : (
                <>
                  {product.stone}
                  <br />
                  <em>Bracelet</em>
                </>
              )}
            </h1>
            <p className="product-subtitle">{product.subtitle}</p>
            <div className="product-price-line">
              <LaunchPrice
                price={product.price}
                compareAtPrice={product.compareAtPrice}
              />
              <span>Opening offer · Inclusive of taxes</span>
            </div>
            <div className="product-divider" />

            {
              <div className="free-size-panel">
                <span className="free-size-icon">
                  <Check aria-hidden size={17} />
                </span>
                <div>
                  <strong>{product.fit || "Fit details"}</strong>
                  <p>
                    Comfortable elastic construction designed for everyday wear.
                  </p>
                </div>
              </div>
            }

            <div className="purchase-row">
              <div
                className="quantity-stepper"
                role="group"
                aria-label="Quantity"
              >
                <button
                  type="button"
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus aria-hidden size={16} />
                </button>
                <span aria-live="polite" aria-label={`Quantity ${qty}`}>
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((value) => value + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus aria-hidden size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={addToBag}
                className="btn-gold purchase-button"
                disabled={!canPurchase}
              >
                Add to bag <span>· {formatPrice(product.price * qty)}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={addToBag}
              className="buy-now-button"
              disabled={!canPurchase}
            >
              Reserve with our team
            </button>

            <div className="product-assurances">
              <span>◇ Authenticity details</span>
              <span>✦ Handmade in India</span>
              <span>⌁ {ritualKit.shortLabel}</span>
            </div>

            <div className="product-panels">
              {/* Editorial Story */}
              <div className="product-story-excerpt">
                <span aria-hidden="true">“</span>
                <p>{product.story.split(".")[0]}.</p>
              </div>

              {/* Information Timeline */}
              <div className="product-symbolism">
                {[
                  { label: "Traditional symbolism", value: product.intention },
                  { label: "A simple daily ritual", value: product.ritual },
                ]
                  .filter((item) => Boolean(item.value))
                  .map((item) => (
                    <div key={item.label}>
                      <h2>{item.label}</h2>
                      <p>{item.value}</p>
                    </div>
                  ))}
              </div>

              {[
                ["details", "Materials & details"],
                ["care", "Care & delivery"],
              ].map(([key, label]) => (
                <div
                  key={key}
                  className={`product-detail-accordion ${openPanel === key ? "is-open" : ""}`}
                >
                  <h2>
                    <button
                      type="button"
                      id={`product-${product.slug}-${key}-toggle`}
                      aria-expanded={openPanel === key}
                      aria-controls={`product-${product.slug}-${key}-panel`}
                      onClick={() =>
                        setOpenPanel(
                          openPanel === key ? null : (key as typeof openPanel),
                        )
                      }
                    >
                      <span>{label}</span>
                      <b aria-hidden="true">+</b>
                    </button>
                  </h2>
                  <div
                    className="product-panel-body"
                    id={`product-${product.slug}-${key}-panel`}
                    role="region"
                    aria-labelledby={`product-${product.slug}-${key}-toggle`}
                    hidden={openPanel !== key}
                  >
                    {key === "details" && (
                      <dl>
                        <div>
                          <dt>Stone</dt>
                          <dd>{product.stone}</dd>
                        </div>
                        <div>
                          <dt>Fit</dt>
                          <dd>{product.fit}</dd>
                        </div>
                        <div>
                          <dt>Bead size</dt>
                          <dd>{product.beadSize}</dd>
                        </div>
                        <div>
                          <dt>Finish</dt>
                          <dd>{product.finish}</dd>
                        </div>
                        <div>
                          <dt>Origin</dt>
                          <dd>{product.origin}</dd>
                        </div>
                      </dl>
                    )}
                    {key === "care" && (
                      <p>
                        Keep away from perfume, oils, harsh chemicals, and
                        prolonged water exposure. Wipe with a soft dry cloth and
                        store in the presentation box.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="product-intention-band">
          <div className="container-luxe">
            <PeacockGlyph />
            <div>
              <div className="eyebrow">The intention</div>
              <blockquote>“{product.intention}”</blockquote>
              <p>{product.ritual}</p>
            </div>
            <div className="intention-qualities">
              {product.qualities.map((quality, index) => (
                <span key={quality}>
                  <b>0{index + 1}</b>
                  {quality}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          className="ritual-kit-summary container-luxe"
          aria-labelledby="product-ritual-kit-title"
        >
          <p className="eyebrow">{ritualKit.shortLabel}</p>
          <h2 id="product-ritual-kit-title">{ritualKit.headline}</h2>
          <p>{ritualKit.summary}</p>
          <Link to="/" hash="ritual-kit" className="text-link">
            See the ritual kit →
          </Link>
        </section>

        <section className="related-products section-space">
          <div className="container-luxe">
            <div className="section-heading">
              <div className="eyebrow">Continue exploring</div>
              <h2>Three more intentions.</h2>
            </div>
            <div className="atelier-grid">
              {related.map((item, index) => (
                <ProductCard key={item.slug} product={item} index={index} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
