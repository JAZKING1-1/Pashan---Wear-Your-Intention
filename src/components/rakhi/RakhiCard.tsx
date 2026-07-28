import React from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";

interface RakhiCardProps {
  image: string;
  zodiac?: string;
  name: string;
  blessing: string;
  gemstone: string;
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
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.08 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group bg-[#F5F2EF] border border-[#C8A15A]/20 p-6 rounded-lg transition-all"
    >
      <div className="overflow-hidden rounded-md mb-6">
        <img
          src={image}
          alt={name}
          className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>
      {zodiac && (
        <p className="text-[#C8A15A] text-xs uppercase tracking-widest mb-1">
          {zodiac}
        </p>
      )}
      <h4 className="font-serif text-2xl mb-2">{name}</h4>
      <p className="text-[#2E1A14]/70 text-sm mb-4">{blessing}</p>
      <p className="text-[#C8A15A] text-xs uppercase tracking-widest mb-6">
        Gemstone: {gemstone}
      </p>

      <div className="flex gap-4">
        <Link
          to={`/rakhi/rashi/${slug}`}
          className="flex-1 py-3 border border-[#2E1A14] text-center text-xs uppercase tracking-widest hover:bg-[#2E1A14] hover:text-[#F5F2EF] transition-all"
        >
          View Details
        </Link>
        <button
          onClick={() => navigate({ to: `/rakhi/rashi/${slug}` })}
          className="flex-1 py-3 bg-[#2E1A14] text-[#F5F2EF] text-xs uppercase tracking-widest hover:bg-[#4a2a20] transition-all"
        >
          Buy Now
        </button>
      </div>
    </motion.div>
  );
}
