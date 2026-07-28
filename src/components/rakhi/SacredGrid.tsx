import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ritualLamp from "@/assets/editorial/ritual-lamp.jpg";
import ritualTemple from "@/assets/editorial/ritual-temple.jpg";
import ritualSaffron from "@/assets/editorial/ritual-saffron.jpg";
import ritualBronze from "@/assets/editorial/ritual-bronze.jpg";
import ritualCopper from "@/assets/editorial/ritual-copper.jpg";
import ritualEmber from "@/assets/editorial/ritual-ember.jpg";

const sacredProducts = [
    { name: "Money Magnet Rakhi", image: ritualLamp, blessing: "For prosperity.", gemstone: "Citrine" },
    { name: "Natural 7 Chakra Rakhi", image: ritualTemple, blessing: "For balance.", gemstone: "Mixed Stones" },
    { name: "Tree of Life Rakhi", image: ritualSaffron, blessing: "For growth.", gemstone: "Green Quartz" },
    { name: "Protection Rakhi", image: ritualBronze, blessing: "For safety.", gemstone: "Lava Stone" },
    { name: "Nazar Rakhi", image: ritualCopper, blessing: "For clarity.", gemstone: "Hematite" },
    { name: "Rudraksha Rakhi", image: ritualEmber, blessing: "For peace.", gemstone: "Rudraksha" },
];

export function SacredGrid() {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-8">
        {sacredProducts.map((product, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="bg-[#E5DCD0] p-6 rounded-lg text-[#2E1A14] border border-[#2E1A14]/20 hover:border-[#2E1A14] transition-all"
          >
            <img src={product.image} alt={product.name} className="w-full h-80 object-cover mb-4 rounded" />
            <h4 className="font-serif text-xl">{product.name}</h4>
            <p className="text-sm opacity-70 mb-2">{product.blessing}</p>
            <p className="text-xs text-[#2E1A14] uppercase font-bold mb-6">{product.gemstone}</p>
            <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedProduct(product)}
                  className="flex-1 border border-[#2E1A14] py-2 text-xs uppercase hover:bg-[#2E1A14] hover:text-[#F5F2EF]"
                >
                  View Details
                </button>
                <button 
                    className="flex-1 bg-[#2E1A14] text-[#F5F2EF] py-2 text-xs uppercase"
                >
                  Buy Now
                </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#F5F2EF] text-[#2E1A14] p-12 max-w-2xl w-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-serif text-4xl mb-4">{selectedProduct.name}</h2>
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-64 object-cover mb-6 rounded" />
              <p className="mb-4">{selectedProduct.blessing}</p>
              <p className="font-bold">Gemstones: {selectedProduct.gemstone}</p>
              <button onClick={() => setSelectedProduct(null)} className="mt-8 bg-[#2E1A14] text-[#F5F2EF] px-8 py-2">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
