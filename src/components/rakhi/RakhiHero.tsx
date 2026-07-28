import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import heroBg from "@/assets/rakhi/hero/hero-bg.jpg";

export function RakhiHero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden text-[#F8F4EE]">
      {/* Cinematic Background */}
      <motion.div
        style={{
          y,
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="absolute inset-0 scale-105"
      />
      
      {/* Premium Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,14,10,0.45),rgba(22,14,10,0.55))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,161,90,0.15),transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="z-10 text-center px-4 max-w-[700px]"
      >
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-8 leading-tight">
          Raksha Bandhan Collection
          <br />
          <span className="font-italic opacity-90 text-3xl md:text-5xl lg:text-5xl block mt-4 text-[#C8A15A]">
            Crafted with Blessings. Worn with Love.
          </span>
        </h1>
        <p className="font-sans text-lg md:text-xl mx-auto mb-12 opacity-90 leading-relaxed">
          Every Rakhi carries more than craftsmanship. It carries intention,
          blessings and the timeless bond between siblings.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-gradient-to-br from-[#C8A15A] to-[#8B6B2B] text-[#1A1A2E] rounded-sm uppercase tracking-widest text-sm font-bold shadow-lg transition-all"
          >
            Explore Collection
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 border border-[#F8F4EE] text-[#F8F4EE] rounded-sm uppercase tracking-widest text-sm transition-all"
          >
            Watch Craftsmanship
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
