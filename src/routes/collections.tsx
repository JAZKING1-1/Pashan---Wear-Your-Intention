import { createFileRoute } from "@tanstack/react-router";
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
        <h1>{a("catalogue")}</h1>
        <p>{a("collectionIntro")}</p>
      </header>
      <section className="container-luxe atelier-catalogue-products">
        <div className="atelier-grid">
          {collections.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
