import React from "react";
import { motion } from "framer-motion";

export function FloatingRakhi() {
  return (
    <section className="relative h-[80vh] flex items-center justify-center bg-[#2E1A14]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="w-[400px] h-[400px] flex items-center justify-center"
      >
        {/* Placeholder for Rakhi image - using a generic placeholder as requested */}
        <div className="w-[300px] h-[300px] rounded-full border-2 border-[#C8A15A]/30 flex items-center justify-center">
          <span className="text-[#C8A15A] font-serif text-2xl opacity-50">
            Rakhi
          </span>
        </div>
      </motion.div>
    </section>
  );
}
