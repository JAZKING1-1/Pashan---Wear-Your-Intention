import type { Collection } from "@/data/products";

interface Props {
  bracelets: Collection[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function StoneSelector({ bracelets, activeIndex, onSelect }: Props) {
  return (
    <nav className="flex flex-col gap-4 p-6 overflow-y-auto">
      {bracelets.map((bracelet, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={bracelet.slug}
            onClick={() => onSelect(index)}
            className={`group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-500 border
              ${isActive 
                ? "opacity-100 bg-white/5 border-copper/50 shadow-[0_0_20px_rgba(184,115,51,0.2)]" 
                : "opacity-60 hover:opacity-100 border-transparent hover:border-white/10"
              }`}
          >
            <img 
                src={bracelet.image} 
                alt={bracelet.stone} 
                className={`w-16 h-16 rounded-lg object-cover transition-transform duration-500 ${isActive ? "scale-105" : "group-hover:scale-105"}`} 
            />
            <div className="flex flex-col text-left">
              <span className="font-serif text-lg">{bracelet.stone}</span>
              <span className="text-xs uppercase tracking-widest text-white/60">
                {bracelet.story.slice(0, 30)}...
              </span>
            </div>
            {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-copper rounded-r-full" />}
          </button>
        );
      })}
    </nav>
  );
}
