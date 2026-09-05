import { motion } from "framer-motion";
import { rashiProductsData } from "@/data/rashiProductsData";
import { useNavigate } from "@tanstack/react-router";

export function RashiGrid() {
  const products = Object.values(rashiProductsData);
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-8">
      {products.map((product) => (
        <motion.div
          key={product.slug}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -5 }}
          className="rashi-product-card group relative bg-[#F5F2EF] p-4 rounded-xl shadow-lg border border-[#C8A15A]/20 hover:border-[#C8A15A] transition-all overflow-hidden"
        >
          <div className="aspect-[4/5] overflow-hidden rounded-lg mb-4">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={product.heroImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700"
            />
          </div>
          <h4 className="font-serif text-lg text-[#2E1A14]">
            {product.name} Rakhi
          </h4>
          <p className="text-xs opacity-70 mb-2 truncate">{product.blessing}</p>
          <p className="text-[10px] text-[#C8A15A] uppercase font-bold mb-6 truncate">
            {product.gemstones.join(", ")}
          </p>

          <div className="rashi-card-actions">
            <button
              type="button"
              onClick={() => navigate({ to: `/rakhi/product/${product.slug}` })}
              className="rashi-card-button is-secondary"
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: `/rakhi/product/${product.slug}` })}
              className="rashi-card-button is-primary"
            >
              Buy Now
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
