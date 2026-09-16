import { rashiCatalogue } from "@/data/rashi-catalogue";
import { RashiCard } from "./RashiExperience";
export function RashiGrid() {
  return (
    <div className="rashi-experience rashi-container">
      <div className="rashi-product-grid">
        {rashiCatalogue.map((product) => (
          <RashiCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
