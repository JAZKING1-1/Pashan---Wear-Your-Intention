import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { motion } from "framer-motion";
import { rashiProducts } from "@/data/rashiImages";

export const Route = createFileRoute("/rakhi/rashi/$slug")({
  loader: ({ params }) => {
    const product = rashiProducts[params.slug];
    if (!product) throw notFound();
    return product;
  },
  component: RashiProductPage,
});

function RashiProductPage() {
  const product = Route.useLoaderData();

  return (
    <SiteLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="min-h-screen bg-[#F5F2EF] text-[#2E1A14] pt-20"
      >
        <div className="container mx-auto px-8 py-16 grid md:grid-cols-2 gap-16">
          {/* Gallery */}
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-lg">
              <img
                src={product.hero}
                alt={product.name}
                className="w-full h-auto aspect-square object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.gallery.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  className="w-full h-auto aspect-square object-cover rounded-md"
                />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="font-serif text-5xl mb-4">{product.name} Rakhi</h1>
              <p className="text-xl opacity-80">{product.blessing}</p>
            </div>

            <div className="border-t border-[#2E1A14]/20 pt-8">
              <h3 className="font-sans uppercase tracking-widest text-xs mb-2 text-[#C8A15A]">
                Gemstones
              </h3>
              <p className="text-lg">{product.gemstone}</p>
            </div>

            <div className="flex gap-4 pt-8">
              <button className="flex-1 py-4 bg-[#2E1A14] text-[#F5F2EF] uppercase tracking-widest text-sm hover:bg-[#4a2a20] transition-all">
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </motion.main>
    </SiteLayout>
  );
}
