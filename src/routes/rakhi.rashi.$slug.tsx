import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { findRashi } from "@/data/rashi-catalogue";
import { RashiProductDetail } from "@/components/rakhi/RashiExperience";
export const Route = createFileRoute("/rakhi/rashi/$slug")({
  loader: ({ params }) => {
    const product = findRashi(params.slug);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? loaderData.title + " · ₹899 — PASHAN"
          : "Rashi — PASHAN",
      },
    ],
  }),
  component: RashiProductPage,
});
function RashiProductPage() {
  const product = Route.useLoaderData();
  return (
    <SiteLayout>
      <RashiProductDetail key={product.slug} product={product} />
    </SiteLayout>
  );
}
