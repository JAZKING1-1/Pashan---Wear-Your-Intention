import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { rashiGuide } from "@/data/products";

export const Route = createFileRoute("/rashi")({
  head: () => ({
    meta: [
      { title: "Shop by Rashi — PASHAN" },
      {
        name: "description",
        content:
          "An educational guide to traditional gemstone associations by zodiac sign.",
      },
      { property: "og:title", content: "Shop by Rashi — PASHAN" },
      {
        property: "og:description",
        content: "Traditional stones associated with each zodiac sign.",
      },
    ],
  }),
  component: RashiPage,
});

function RashiPage() {
  return (
    <SiteLayout>
      <section className="container-luxe pt-16 pb-12">
        <div className="max-w-3xl">
          <div className="eyebrow">Shop by Rashi</div>
          <h1 className="mt-5 font-serif text-[clamp(2.5rem,6vw,5rem)] leading-[1.02]">
            Stones by sign.
            <br />
            <span className="italic text-[color:var(--gold)]">
              An educational guide.
            </span>
          </h1>
          <p className="mt-8 text-lg text-[color:var(--muted-foreground)] leading-relaxed">
            Across traditions, certain natural stones have come to be associated
            with certain temperaments. This guide is offered as a starting point
            — never as a prescription.
          </p>
        </div>
      </section>

      <section className="container-luxe pb-24">
        <div className="grid gap-px bg-[color:var(--border)] sm:grid-cols-2 lg:grid-cols-3">
          {rashiGuide.map((r, i) => (
            <article
              key={r.sign}
              className="rashi-guide-card bg-[color:var(--background)] p-8"
            >
              <div className="text-[0.65rem] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                No. {String(i + 1).padStart(2, "0")}
              </div>
              <h2 className="mt-4 font-serif text-3xl">{r.sign}</h2>
              <div className="mt-3 text-sm text-[color:var(--gold)]">
                {r.stones}
              </div>
              <p className="mt-4 text-sm text-[color:var(--muted-foreground)] leading-relaxed">
                {r.note}
              </p>
              <Link to="/collections" className="rashi-guide-action">
                Explore these stones
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container-luxe pb-28 text-center">
        <Link to="/collections" className="btn-gold inline-flex">
          Browse Collections
        </Link>
      </section>
    </SiteLayout>
  );
}
