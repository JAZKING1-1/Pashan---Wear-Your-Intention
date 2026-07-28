import type { Collection } from "@/data/products";

interface Props {
  bracelets: Collection[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function StoneSelector({ bracelets, activeIndex, onSelect }: Props) {
  return (
    <nav className="flex flex-wrap justify-center gap-4 p-6">
      {bracelets.map((bracelet, index) => {
        const isActive = index === activeIndex;
        // Use a clearer image for the selector
        const thumbnail =
          bracelet.images[1] ?? bracelet.images[0] ?? bracelet.image;
        return (
          <button
            key={bracelet.slug}
            onClick={() => onSelect(index)}
            className={`group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-500
              ${isActive ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
          >
            <img
              src={thumbnail}
              alt={bracelet.stone}
              className={`w-20 h-20 rounded-full object-cover transition-transform duration-500 ${isActive ? "scale-110 border-2 border-copper" : "group-hover:scale-105"}`}
            />
            <span className="font-serif text-sm">{bracelet.stone}</span>
          </button>
        );
      })}
    </nav>
  );
}
