import { useEffect, useRef, useState } from "react";

export type HeroIndicatorSection = { id: string; label: string };

/**
 * Vertical "01–05" page-section navigation for the hero.
 * A single IntersectionObserver watches all sections; a section becomes
 * active while it crosses the horizontal band around the viewport middle.
 */
export function HeroSectionIndicator({
  sections,
  onNavigate,
}: {
  sections: HeroIndicatorSection[];
  onNavigate?: (id: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const ratios = useRef(new Map<string, number>());

  useEffect(() => {
    const elements = sections
      .map((section) => ({
        id: section.id,
        el: document.getElementById(section.id),
      }))
      .filter((item): item is { id: string; el: HTMLElement } =>
        Boolean(item.el),
      );
    if (elements.length === 0) return;

    const pick = () => {
      // Document order wins: the first section occupying the band is active.
      for (const item of elements) {
        if ((ratios.current.get(item.id) ?? 0) > 0) {
          setActiveIndex(elements.indexOf(item));
          return;
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.current.set(
            (entry.target as HTMLElement).id,
            entry.intersectionRatio,
          );
        }
        pick();
      },
      // A thin horizontal band around 45–55% of the viewport decides which
      // section is "current". Cheap: no continuous scroll listener.
      { rootMargin: "-44% 0px -44% 0px", threshold: [0, 0.01, 0.1, 0.5, 1] },
    );
    elements.forEach((item) => observer.observe(item.el));

    // Initial state without waiting for the first observer callback.
    const bandTop = window.innerHeight * 0.44;
    const bandBottom = window.innerHeight * 0.56;
    for (const [index, item] of elements.entries()) {
      const rect = item.el.getBoundingClientRect();
      if (rect.top <= bandBottom && rect.bottom >= bandTop) {
        setActiveIndex(index);
        break;
      }
    }

    return () => {
      observer.disconnect();
      ratios.current.clear();
    };
  }, [sections]);

  return (
    <nav className="hero-section-indicator" aria-label="Homepage sections">
      <span className="indicator-rule" aria-hidden="true">
        <span
          className="indicator-marker"
          style={{ transform: `translateY(${activeIndex * 100}%)` }}
        />
      </span>
      <ol className="indicator-numbers">
        {sections.map((section, index) => (
          <li key={section.id}>
            <button
              type="button"
              className={`indicator-button${
                index === activeIndex ? " is-active" : ""
              }`}
              aria-label={section.label}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => onNavigate?.(section.id)}
            >
              {String(index + 1).padStart(2, "0")}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
