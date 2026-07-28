import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { RakhiHero } from "@/components/rakhi/RakhiHero";
import { ChooseCollection } from "@/components/rakhi/ChooseCollection";
import { RashiGrid } from "@/components/rakhi/RashiGrid";
import { SacredGrid } from "@/components/rakhi/SacredGrid";
import { motion } from "framer-motion";

export const Route = createFileRoute("/rakhi")({
  component: RakhiPage,
});

function RakhiPage() {
  return (
    <SiteLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="min-h-screen bg-[#F5F2EF]"
      >
        <RakhiHero />

        {/* Intro */}
        <section className="py-24 text-center px-8">
          <h3 className="font-serif text-3xl mb-6">PASHAN Raksha Bandhan</h3>
          <p className="font-sans text-xl opacity-70">
            A tribute to the timeless bonds.
          </p>
        </section>

        <ChooseCollection />

        {/* Rashi Section */}
        <section id="rashi-section" className="py-24 bg-[#1A1A2E] text-[#F5F2EF]">
          <div className="text-center mb-16">
            <h2 className="font-serif text-5xl mb-6">Rashi Collection</h2>
            <p className="font-sans text-lg opacity-80">
              Find the Rakhi aligned with their zodiac sign.
            </p>
          </div>
          <RashiGrid />
        </section>

        {/* Sacred Section */}
        <section id="sacred-section" className="py-24 bg-[#E5DCD0] text-[#2E1A14]">
          <div className="text-center mb-16">
            <h2 className="font-serif text-5xl mb-6">Sacred Intentions</h2>
            <p className="font-sans text-lg opacity-80">
              Inspired by blessings, prosperity, and balance.
            </p>
          </div>
          <SacredGrid />
        </section>
      </motion.main>
    </SiteLayout>
  );
}
