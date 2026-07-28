import { createFileRoute, notFound, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { rashiProductsData } from "@/data/rashiProductsData";
import { RakhiProductTemplate } from "@/components/rakhi/RakhiProductTemplate";

export const Route = createFileRoute("/rakhi/product/$slug")({
  validateSearch: (search: Record<string, unknown>) => ({
    action: (search.action as string) || undefined,
  }),
  loader: ({ params }) => {
    const product = rashiProductsData[params.slug];
    if (!product) throw notFound();
    return product;
  },
  component: RakhiProductPage,
});

function RakhiProductPage() {
  const product = Route.useLoaderData();
  const { action } = useSearch({ from: Route.fullPath });

  useEffect(() => {
    if (action === "purchase") {
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById("purchase-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [action]);

  return <RakhiProductTemplate product={product} />;
}
