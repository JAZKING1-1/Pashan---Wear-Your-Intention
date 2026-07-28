import type { Collection } from "@/data/products";

interface Props {
  bracelets: Collection[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function StoneSelector({ bracelets, activeIndex, onSelect }: Props) {
  return (
    <nav className="stone-selector-rail" aria-label="Choose a stone to explore">
      {bracelets.map((bracelet, index) => {
        const isActive = index === activeIndex;
        const thumbnail =
          bracelet.images[1] ?? bracelet.images[0] ?? bracelet.image;
        return (
          <button
            type="button"
            key={bracelet.slug}
            onClick={() => onSelect(index)}
            className={`stone-selector-option ${isActive ? "is-active" : ""}`}
            aria-pressed={isActive}
            aria-label={`Explore ${bracelet.stone}`}
          >
            <img src={thumbnail} alt="" aria-hidden />
            <span>{bracelet.stone}</span>
            <small>{bracelet.intention}</small>
          </button>
        );
      })}
    </nav>
  );
}
