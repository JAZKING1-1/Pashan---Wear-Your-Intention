import React from "react";
import { motion } from "framer-motion";
import { type RashiProductData } from "@/data/rashiProductsData";
import { SiteLayout } from "@/components/SiteLayout";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

interface Props {
  product: RashiProductData;
}

export function RakhiProductTemplate({ product }: Props) {
  return (
    <SiteLayout>
      <motion.main initial="hidden" animate="visible" variants={staggerContainer} className="bg-[#F8F4EE] text-[#2E1A14]">
        {/* Hero */}
        <section id="purchase-section" className="relative h-screen flex flex-col items-center justify-center text-center">
            <img src={product.heroImage} alt={product.name} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[#F8F4EE]" />
            <motion.h1 variants={staggerItem} className="relative z-10 font-serif text-6xl md:text-8xl text-[#F8F4EE] mb-6">{product.name} Rakhi</motion.h1>
            <motion.p variants={staggerItem} className="relative z-10 text-xl md:text-2xl text-[#F8F4EE] opacity-90 max-w-lg mb-12">{product.blessing}</motion.p>
            <motion.button variants={staggerItem} className="relative z-10 bg-gradient-to-br from-[#C8A15A] to-[#8B6B2B] text-[#1A1A2E] px-10 py-4 uppercase tracking-widest font-bold hover:shadow-lg transition-all hover:scale-105">Buy This Rakhi</motion.button>
        </section>

        {/* The Meaning */}
        <section className="py-24 container mx-auto px-8 max-w-3xl text-center">
            <motion.h2 variants={staggerItem} className="font-serif text-5xl mb-8 text-[#2A1712]">The Meaning</motion.h2>
            <motion.p variants={staggerItem} className="text-xl leading-loose opacity-80">{product.meaning}</motion.p>
        </section>

        {/* Benefits */}
        <section className="py-24 bg-[#E5DCD0]">
            <div className="container mx-auto px-8">
                <motion.h2 variants={staggerItem} className="font-serif text-5xl text-center mb-16 text-[#2A1712]">Why Choose This Rakhi</motion.h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {product.benefits.map((benefit, i) => (
                        <motion.div variants={staggerItem} key={i} className="bg-[#F8F4EE] p-8 rounded-lg shadow-sm border border-[#2E1A14]/10">
                            <p className="text-lg font-medium">✓ {benefit}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* Natural Gemstones */}
        <section className="py-24 container mx-auto px-8">
            <motion.h2 variants={staggerItem} className="font-serif text-5xl text-center mb-16 text-[#2A1712]">Natural Gemstones</motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-center">
                {product.gemstones.map(stone => (
                    <motion.div variants={staggerItem} key={stone} className="bg-[#2A1712] p-8 rounded-lg text-center text-[#F8F4EE]">
                        <p className="font-bold text-[#C8A15A] text-xl">{stone}</p>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* What's Included */}
        <section className="py-24 bg-[#2A1712] text-[#F8F4EE]">
            <div className="container mx-auto px-8">
                <motion.h2 variants={staggerItem} className="font-serif text-5xl text-center mb-16">Included With Every Rakhi</motion.h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {product.inclusions.map((item, i) => (
                        <motion.div variants={staggerItem} key={i} className="bg-[#3D251E] p-6 rounded-lg text-center border border-[#C8A15A]/20">
                            <p className="text-sm font-medium">{item}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

        {/* Story */}
        <section className="py-24 container mx-auto px-8 max-w-4xl">
            <motion.h2 variants={staggerItem} className="font-serif text-5xl mb-8 text-[#2A1712] text-center">The Story Behind This Rakhi</motion.h2>
            {product.story.map((para, i) => (
                <motion.p variants={staggerItem} key={i} className="text-lg leading-loose mb-6 opacity-80">{para}</motion.p>
            ))}
        </section>
        
        {/* Final CTA */}
        <section className="py-24 text-center">
            <motion.h2 variants={staggerItem} className="font-serif text-5xl mb-12">Celebrate Raksha Bandhan with Meaning</motion.h2>
            <motion.button variants={staggerItem} className="bg-gradient-to-br from-[#C8A15A] to-[#8B6B2B] text-[#1A1A2E] px-12 py-5 uppercase tracking-widest font-bold text-lg hover:shadow-2xl transition-all">Buy This Rakhi</motion.button>
        </section>

      </motion.main>
    </SiteLayout>
  );
}
