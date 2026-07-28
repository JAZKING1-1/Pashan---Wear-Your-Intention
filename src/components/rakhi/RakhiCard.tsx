import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";

interface RakhiCardProps {
  image: string;
  zodiac?: string;
  name: string;
  blessing: string;
  gemstone: string[];
  slug: string;
}

export function RakhiCard({
  image,
  zodiac,
  name,
  blessing,
  gemstone,
  slug,
}: RakhiCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="group relative bg-[#F8F4EE] p-5 rounded-xl shadow-lg border border-[#C8A15A]/20 hover:border-[#C8A15A] transition-all overflow-hidden"
    >
      <div className="aspect-[4/5] overflow-hidden rounded-lg mb-4">
        <motion.img
          whileHover={{ scale: 1.05 }}
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700"
        />
      </div>
      {zodiac && (
        <p className="text-[10px] text-[#6A5144] uppercase tracking-widest mb-1">
          {zodiac}
        </p>
      )}
      <h4 className="font-serif text-lg text-[#2A1712] font-semibold mb-2">
        {name} Rakhi
      </h4>
      <p className="text-xs text-[#4B3C34] mb-3 leading-relaxed">{blessing}</p>
      <p className="text-[10px] text-[#8B5E3C] uppercase font-bold mb-6">
        {gemstone.join(", ")}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => navigate({ to: `/rakhi/product/${slug}` })}
          className="flex-1 border border-[#2A1712] py-2 text-[10px] uppercase tracking-widest text-[#2A1712] hover:bg-[#A0522D] hover:text-white transition-all"
        >
          VIEW DETAILS
        </button>
        <button
          onClick={() =>
            navigate({
              to: `/rakhi/product/${slug}`,
              search: { action: "purchase" },
            })
          }
          className="flex-1 bg-[#2A1712] text-[#F8F4EE] py-2 text-[10px] uppercase tracking-widest hover:bg-[#4B3C34] transition-all"
        >
          BUY NOW
        </button>
      </div>
    </motion.div>
  );
}
