import React from 'react';
import { motion } from 'framer-motion';

export function RakhiHero() {
  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#F5F2EF] text-[#2E1A14]">
      {/* Background Visuals (Simulated Depth) */}
      <div className="absolute inset-0 bg-marble-texture opacity-30"></div>
      <div className="absolute inset-0 bg-radial-gradient-to-t from-[#E5DCD0] to-transparent"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="z-10 text-center px-4"
      >
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-8 leading-tight">
          Raksha Bandhan Collection<br/>
          <span className="font-italic opacity-80 text-4xl md:text-5xl lg:text-6xl">Crafted with Blessings. Worn with Love.</span>
        </h1>
        <p className="font-sans text-lg md:text-xl max-w-xl mx-auto mb-12 opacity-80">
          Every Rakhi carries more than craftsmanship. It carries intention, blessings and the timeless bond between siblings.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-8 py-4 bg-[#2E1A14] text-[#F5F2EF] rounded-sm uppercase tracking-widest text-sm hover:bg-[#4a2a20] transition-all">Explore Collection</button>
            <button className="px-8 py-4 border border-[#2E1A14] text-[#2E1A14] rounded-sm uppercase tracking-widest text-sm hover:bg-[#2E1A14]/5 transition-all">Watch Craftsmanship</button>
        </div>
      </motion.div>
    </section>
  );
}
