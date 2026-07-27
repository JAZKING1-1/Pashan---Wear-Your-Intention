import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { RakhiHero } from "@/components/rakhi/RakhiHero";
import { ChooseCollection } from "@/components/rakhi/ChooseCollection";
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
            <p className="font-sans text-xl opacity-70">A tribute to the timeless bonds.</p>
        </section>

        <ChooseCollection />
        
        {/* Placeholder for subsequent sections */}
        <section className="py-20 text-center">
            <h2 className="font-serif text-4xl">More Experiences Building...</h2>
        </section>
      </motion.main>
    </SiteLayout>
  );
}
