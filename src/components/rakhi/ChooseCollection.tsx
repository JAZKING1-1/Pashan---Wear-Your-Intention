import React from "react";
import { motion } from "framer-motion";

export function ChooseCollection() {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="py-24 bg-[#F5F2EF] text-[#2E1A14] overflow-hidden">
      <div className="text-center mb-16">
        <h2 className="font-serif text-5xl mb-6">Choose Your Rakhi Journey</h2>
        <p className="font-sans text-lg max-w-xl mx-auto opacity-80">
          Every Rakhi begins with a different intention. Some are guided by the
          stars. Others by the blessings you wish to give.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 px-8">
        {/* Rashi Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => scrollTo("rashi-section")}
          className="relative h-[60vh] bg-[#1A1A2E] text-[#F5F2EF] p-12 flex flex-col justify-end group cursor-pointer"
        >
          <div className="absolute inset-0 bg-stars opacity-50"></div>
          <h3 className="font-serif text-4xl mb-4 relative z-10">
            Rashi Collection
          </h3>
          <p className="mb-8 relative z-10 opacity-80">
            Find the Rakhi aligned with their zodiac.
          </p>
          <button className="w-fit border border-[#C8A15A] px-6 py-3 uppercase tracking-widest text-xs group-hover:bg-[#C8A15A] group-hover:text-[#1A1A2E] transition-all">
            Explore Rashi
          </button>
        </motion.div>

        {/* Sacred Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => scrollTo("sacred-section")}
          className="relative h-[60vh] bg-[#E5DCD0] text-[#2E1A14] p-12 flex flex-col justify-end group cursor-pointer"
        >
          <div className="absolute inset-0 bg-marble-texture opacity-30"></div>
          <h3 className="font-serif text-4xl mb-4 relative z-10">
            Sacred Intentions
          </h3>
          <p className="mb-8 relative z-10 opacity-80">
            Inspired by blessings, prosperity, and balance.
          </p>
          <button className="w-fit border border-[#2E1A14] px-6 py-3 uppercase tracking-widest text-xs group-hover:bg-[#2E1A14] group-hover:text-[#E5DCD0] transition-all">
            Explore Sacred
          </button>
        </motion.div>
      </div>
    </section>
  );
}
