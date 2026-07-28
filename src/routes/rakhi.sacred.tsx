import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { RakhiCard } from "@/components/rakhi/RakhiCard";
import { motion } from "framer-motion";

export const Route = createFileRoute("/rakhi/sacred")({
  component: SacredPage,
});

function SacredPage() {
  const sacredRakhis = [
    { name: "Money Magnet", blessing: "For prosperity.", gemstone: "Pyrite" },
    { name: "Protection", blessing: "For safety.", gemstone: "Lava" },
  ];

  return (
    <SiteLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="min-h-screen bg-[#E5DCD0] text-[#2E1A14] pt-20"
      >
        <section className="text-center py-24">
          <h1 className="font-serif text-6xl mb-6">Sacred Intentions</h1>
          <p className="font-sans text-xl opacity-80">
            Inspired by blessings, prosperity, and balance.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 pb-20">
          {sacredRakhis.map((rakhi, i) => (
            <RakhiCard
              key={i}
              image="/placeholder.jpg" // Will map to actual assets
              name={rakhi.name}
              blessing={rakhi.blessing}
              gemstone={rakhi.gemstone}
            />
          ))}
        </section>
      </motion.main>
    </SiteLayout>
  );
}
