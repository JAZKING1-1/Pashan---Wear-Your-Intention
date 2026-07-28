import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { BraceletComposer } from "@/components/BraceletComposer";
import { SiteLayout } from "@/components/SiteLayout";
import { PeacockGlyph } from "@/components/BrandMark";
import { ProductCard } from "@/components/ProductCard";
import { LaunchPrice } from "@/components/LaunchPrice";
import { Reveal } from "@/components/Reveal";
import {
  collections,
  describeCustomComposition,
  getCollection,
  type CustomStoneKey,
} from "@/data/products";
import { formatPrice, useCart } from "@/lib/cart";
import presentationImage from "@/assets/brand/packaging-cardboard.webp";

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
  const [customBeads, setCustomBeads] = useState<CustomStoneKey[]>([]);
  const [qty, setQty] = useState(1);
  const [openPanel, setOpenPanel] = useState<
    "story" | "details" | "care" | null
  >("story");
  const related = collections
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);

  useEffect(() => {
    setSelectedImage(0);
    setCustomBeads([]);
  }, [product.slug]);

  const moveImage = (direction: -1 | 1) => {
    setSelectedImage(
      (index) =>
        (index + direction + product.images.length) % product.images.length,
    );
  };

  const customComposition = describeCustomComposition(customBeads);
  const canPurchase = !product.isCustom || customBeads.length > 0;

  const addToBag = () => {
    if (!canPurchase) return;

    add(
      {
        slug: product.isCustom
          ? `${product.slug}:${customBeads.join(".")}`
          : product.slug,
        name: product.title,
        stone: product.isCustom
          ? `${customComposition} - Free size custom composition`
          : `${product.stone} - Free size`,
        price: product.price,
        image: product.image,
      },
      qty,
    );
  };

  return (
    <SiteLayout>
      <section className="product-breadcrumb container-luxe">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/collections">Bracelets</Link>
        <span>/</span>
        <strong>{product.stone}</strong>
      </section>

      {product.isCustom && (
        <div className="container-luxe customisation-service-wrap">
          <BraceletComposer beads={customBeads} onChange={setCustomBeads} />
        </div>
      )}

      <section className="product-stage container-luxe">
        <div className="product-gallery">
          <div className="product-gallery-main grain">
            <img
              key={product.images[selectedImage]}
              src={product.images[selectedImage]}
              alt={
                product.imageAlts[selectedImage] ??
                `${product.stone} bracelet view ${selectedImage + 1}`
              }
              className="product-gallery-slide"
            />
            <span className="product-gallery-count" aria-live="polite">
              {String(selectedImage + 1).padStart(2, "0")} /{" "}
              {String(product.images.length).padStart(2, "0")}
            </span>
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
          </div>
          <div className="product-thumbnails" aria-label="Product images">
            {product.images.map((image, index) => (
              <button
                key={image}
                onClick={() => setSelectedImage(index)}
                className={selectedImage === index ? "is-active" : ""}
                aria-label={`Show image ${index + 1}`}
              >
                <img src={image} alt="" loading="lazy" />
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

          {product.isCustom ? (
            <div className="custom-order-summary">
              <div className="product-option-title">
                <span>Your composition</span>
                <span>{customBeads.length} / 18 beads</span>
              </div>
              <p>
                {customComposition ||
                  "Your thread is empty. Build a bracelet in the studio above before reserving."}
              </p>
              <a href="#bracelet-composer">Edit composition</a>
            </div>
          ) : (
            <div className="free-size-panel">
              <span className="free-size-icon">
                <Check aria-hidden size={17} />
              </span>
              <div>
                <strong>Free size</strong>
                <p>
                  Comfortable elastic construction designed for everyday wear.
                </p>
              </div>
            </div>
          )}

          <div className="purchase-row">
            <div className="quantity-stepper">
              <button
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                aria-label="Decrease quantity"
              >
                <Minus aria-hidden size={16} />
              </button>
              <span>{qty}</span>
              <button
                onClick={() => setQty((value) => value + 1)}
                aria-label="Increase quantity"
              >
                <Plus aria-hidden size={16} />
              </button>
            </div>
            <button
              onClick={addToBag}
              className="btn-gold purchase-button"
              disabled={!canPurchase}
            >
              Add to bag <span>· {formatPrice(product.price * qty)}</span>
            </button>
          </div>
          <button
            onClick={addToBag}
            className="buy-now-button"
            disabled={!canPurchase}
          >
            Reserve with our team
          </button>

          <div className="product-assurances">
            <span>◇ Authenticity details</span>
            <span>✦ Handmade in India</span>
            <span>⌁ Premium presentation</span>
          </div>

          <div className="product-panels">
            {/* Editorial Story */}
            <div className="my-8 p-6 bg-stone-50 border-l-4 border-l-amber-700">
              <span className="text-4xl text-amber-700 leading-none">“</span>
              <p className="font-serif text-lg italic text-stone-800">
                {product.story.split(".")[0]}.
              </p>
            </div>

            {/* Information Timeline */}
            <div className="timeline mt-12 flex flex-col gap-6">
              {[
                { label: "Stone Nature", value: product.nature },
                {
                  label: "Traditional Association",
                  value: product.association,
                },
                { label: "Ideal For", value: product.idealFor },
                { label: "Daily Ritual", value: product.ritual },
                { label: "Why People Wear It", value: product.whyWear },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="timeline-item opacity-0 animate-[pashan-timeline-in_0.5s_cubic-bezier(.22,1,.36,1)_forwards]"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  <h4 className="text-xs uppercase tracking-widest text-amber-700 font-bold">
                    {item.label}
                  </h4>
                  <p className="text-stone-700 mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {[
              ["details", "Materials & details"],
              ["care", "Care & delivery"],
            ].map(([key, label]) => (
              <div key={key} className={openPanel === key ? "is-open" : ""}>
                <button
                  onClick={() =>
                    setOpenPanel(
                      openPanel === key ? null : (key as typeof openPanel),
                    )
                  }
                >
                  <span>{label}</span>
                  <b>+</b>
                </button>
                <div className="product-panel-body">
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

      <section className="product-presentation container-luxe section-space">
        <Reveal className="product-presentation-image">
          <img
            src={presentationImage}
            alt="PASHAN premium presentation with bracelet and authenticity card"
          />
        </Reveal>
        <Reveal className="product-presentation-copy" delay={120}>
          <div className="eyebrow">Included with every piece</div>
          <h2>
            Designed to arrive
            <br />
            <em>like an offering.</em>
          </h2>
          <p>
            The bracelet is only one part of the experience. Each order is
            presented with a considered box, stone story, intention card, and
            authenticity details.
          </p>
          <ul>
            <li>Premium keepsake box</li>
            <li>Stone and intention card</li>
            <li>Authenticity details</li>
            <li>Care guidance</li>
          </ul>
        </Reveal>
      </section>

      <section className="related-products section-space">
        <div className="container-luxe">
          <div className="section-heading">
            <div className="eyebrow">Continue exploring</div>
            <h2>Three more intentions.</h2>
          </div>
          <div className="related-grid">
            {related.map((item, index) => (
              <ProductCard key={item.slug} product={item} index={index} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
