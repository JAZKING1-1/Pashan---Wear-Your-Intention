import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { collections } from "@/data/products";

export const Route = createFileRoute("/rituals")({
  head: () => ({
    meta: [
      { title: "The Rituals — PASHAN" },
      {
        name: "description",
        content:
          "How to wear a PASHAN bracelet as a quiet daily ritual of intention.",
      },
      { property: "og:title", content: "The Rituals — PASHAN" },
      {
        property: "og:description",
        content: "Symbolism and mindful daily practice with a PASHAN bracelet.",
      },
    ],
  }),
  component: RitualsPage,
});

function RitualsPage() {
  return (
    <SiteLayout>
      <section className="container-luxe pt-16 pb-12">
        <div className="max-w-3xl">
          <div className="eyebrow">The Rituals</div>
          <h1 className="mt-5 font-serif text-[clamp(2.5rem,6vw,5rem)] leading-[1.02]">
            A small daily practice.
            <br />
            <span className="italic text-[color:var(--gold)]">
              Worn, not spoken.
            </span>
          </h1>
          <p className="mt-8 text-lg text-[color:var(--muted-foreground)] leading-relaxed">
            A PASHAN bracelet is a private object. The ritual of putting it on,
            of choosing it for a particular morning, is the practice. Below: how
            our owners wear theirs.
          </p>
        </div>
      </section>

      <section className="container-luxe pb-24">
        <div className="grid gap-px bg-[color:var(--border)] md:grid-cols-2">
          {collections.map((c) => (
            <div
              key={c.slug}
              className="bg-[color:var(--background)] p-10 md:p-12"
            >
              <div className="text-[0.65rem] uppercase tracking-[0.28em] text-[color:var(--gold)]">
                {c.name} · {c.stone}
              </div>
              <h2 className="mt-4 font-serif text-3xl">{c.intention}</h2>
              <p className="mt-6 text-[color:var(--muted-foreground)] leading-relaxed">
                {c.ritual}
              </p>
              <Link
                to="/collections/$slug"
                params={{ slug: c.slug }}
                className="mt-8 inline-flex text-[0.7rem] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
              >
                The Collection →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container-luxe pb-32">
        <div className="border border-[color:var(--border)] bg-[color:var(--surface)] px-8 md:px-16 py-16 text-center">
          <div className="eyebrow">A Note on Language</div>
          <p className="mt-6 max-w-2xl mx-auto text-[color:var(--muted-foreground)] leading-relaxed">
            PASHAN describes stones by their traditional and historical
            associations. We make no medical claims and no supernatural
            promises. What we offer is the considered object itself — and the
            meaning you bring to it.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
