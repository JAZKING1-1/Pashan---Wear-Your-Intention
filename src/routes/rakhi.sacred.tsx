import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { collections } from "@/data/products";

export const Route = createFileRoute("/rakhi/sacred")({
  head: () => ({ meta: [{ title: "Sacred Intentions — PASHAN" }] }),
  component: SacredPage,
});

function SacredPage() {
  const bracelets = collections.filter(
    (product) => product.slug === "pyrite" || product.slug === "lava",
  );

  return (
    <SiteLayout>
      <header className="atelier-catalogue-header" lang="en" dir="ltr">
        <p className="eyebrow">Objects of intention</p>
        <h1>Sacred Intentions</h1>
        <p>
          Explore the available Rashi collection, or choose a natural-stone
          bracelet below.
        </p>
        <nav
          className="atelier-catalogue-links"
          aria-label="Collection guidance"
        >
          <Link to="/rashi">Explore the Rashi collection →</Link>
          <Link to="/collections">Shop all bracelets →</Link>
        </nav>
      </header>
      <section
        className="container-luxe atelier-catalogue-products"
        aria-label="Natural-stone bracelets"
      >
        <div className="atelier-catalogue-meta" lang="en" dir="ltr">
          <span>{bracelets.length} natural-stone bracelets</span>
          <span>
            These are bracelets. Rashi pieces have their own collection.
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {bracelets.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
