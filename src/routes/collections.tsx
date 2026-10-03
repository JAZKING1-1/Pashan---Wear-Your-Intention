import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { collections } from "@/data/products";
import { collectionsHeroPhoto } from "@/data/product-photography";
import { useAtelierCopy } from "@/data/atelier-copy";
import "@/styles-collections.css";

export const Route = createFileRoute("/collections")({
  head: () => ({ meta: [{ title: "The Bracelet Collection — PASHAN" }] }),
  component: CollectionsPage,
});

const EASE = [0.22, 0.61, 0.36, 1] as const;

function CollectionsPage() {
  const { a } = useAtelierCopy();
  const reduced = useReducedMotion();
  const hero = collectionsHeroPhoto();

  // Reduced motion keeps the opacity settle and drops every transform.
  const reveal = (delay: number, distance = 16) =>
    reduced
      ? ({
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          transition: { duration: 0.3, delay: 0 },
          viewport: { once: true, amount: 0.2 },
        } as const)
      : ({
          initial: { opacity: 0, y: distance },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: EASE },
          viewport: { once: true, amount: 0.2 },
        } as const);

  return (
    <SiteLayout>
      {/* Editorial catalogue on clean ivory. collections-background.png is
          used once, as the hero band; the cards carry the campaign frames. */}
      <div className="collections-page">
        <motion.header
          className="atelier-catalogue-header collections-masthead"
          {...reveal(0, 16)}
        >
          <div className="collections-hero">
            <img className="collections-hero-image" {...hero} />
            <span className="collections-hero-scrim" />
            <div className="collections-hero-content">
              <p className="eyebrow" lang="en" dir="ltr">
                Objects of intention
              </p>
              <h1>{a("catalogue")}</h1>
              <p>{a("collectionIntro")}</p>
              <nav
                className="atelier-catalogue-links"
                aria-label="Collection guidance"
                lang="en"
                dir="ltr"
              >
                <Link to="/find-your-bracelet">Help me choose →</Link>
                <Link to="/products/$slug" params={{ slug: "make-your-own" }}>
                  Make your own →
                </Link>
                <Link to="/rashi">Explore Rashi →</Link>
              </nav>
            </div>
          </div>
        </motion.header>

        <section className="container-luxe atelier-catalogue-products">
          <motion.div
            className="atelier-catalogue-meta"
            lang="en"
            dir="ltr"
            {...reveal(0.06, 12)}
          >
            <span>
              {collections.filter((product) => !product.isCustom).length}{" "}
              bracelets · 1 making table
            </span>
            <span>Photographed in natural light. Each stone varies.</span>
          </motion.div>
          <div className="atelier-grid">
            {collections.map((product, index) => (
              <ProductCard
                key={product.slug}
                product={product}
                index={index}
                campaign
              />
            ))}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}