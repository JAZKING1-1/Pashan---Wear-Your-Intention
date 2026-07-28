import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { RakhiCard } from "@/components/rakhi/RakhiCard";
import { motion } from "framer-motion";
import { rashiProducts } from "@/data/rashiImages";

export const Route = createFileRoute("/rakhi/rashi")({
  component: RashiPage,
});

function RashiPage() {
  const products = Object.values(rashiProducts);

  return (
    <SiteLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="min-h-screen bg-[#F5F2EF] text-[#2E1A14] pt-20"
      >
        <section className="text-center py-24 px-8">
          <h1 className="font-serif text-6xl mb-6 text-[#2E1A14]">
            Rashi Collection
          </h1>
          <p className="font-sans text-xl opacity-80 max-w-2xl mx-auto">
            Guided by the stars, crafted for your intention. Each Rashi Rakhi is
            a reflection of the sign it represents.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8 pb-32">
          {products.map((rakhi) => (
            <RakhiCard
              key={rakhi.slug}
              image={rakhi.thumbnail}
              zodiac={rakhi.name}
              name={rakhi.name}
              blessing={rakhi.blessing}
              gemstone={rakhi.gemstone}
              slug={rakhi.slug}
            />
          ))}
        </section>
      </motion.main>
    </SiteLayout>
  );
}
