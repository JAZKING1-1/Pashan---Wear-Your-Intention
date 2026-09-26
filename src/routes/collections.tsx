import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { collections } from "@/data/products";
import { useAtelierCopy } from "@/data/atelier-copy";
export const Route = createFileRoute("/collections")({
  head: () => ({ meta: [{ title: "The Bracelet Collection — PASHAN" }] }),
  component: CollectionsPage,
});
function CollectionsPage() {
  const { a } = useAtelierCopy();
  return (
    <SiteLayout>
      <header className="atelier-catalogue-header">
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
      </header>
      <section className="container-luxe atelier-catalogue-products">
        <div className="atelier-catalogue-meta" lang="en" dir="ltr">
          <span>
            {collections.filter((product) => !product.isCustom).length}{" "}
            bracelets · 1 making table
          </span>
          <span>Photographed in natural light. Each stone varies.</span>
        </div>
        <div className="atelier-grid">
          {collections.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
