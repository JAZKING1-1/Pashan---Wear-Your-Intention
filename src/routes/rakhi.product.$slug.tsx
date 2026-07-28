import { createFileRoute, notFound } from "@tanstack/react-router";
import { rashiProductsData } from "@/data/rashiProductsData";
import { RakhiProductTemplate } from "@/components/rakhi/RakhiProductTemplate";

export const Route = createFileRoute("/rakhi/product/$slug")({
  loader: ({ params }) => {
    const product = rashiProductsData[params.slug];
    if (!product) throw notFound();
    return product;
  },
  component: RakhiProductPage,
});

function RakhiProductPage() {
  const product = Route.useLoaderData();
  return <RakhiProductTemplate product={product} />;
}
