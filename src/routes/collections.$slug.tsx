import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { LaunchPrice } from "@/components/LaunchPrice";
import { collections, getCollection } from "@/data/products";
import { formatPrice, useCart } from "@/lib/cart";
import { ritualKit } from "@/data/ritual-kit";

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ params }) => {
    const c = getCollection(params.slug);
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — PASHAN` },
          { name: "description", content: loaderData.story.slice(0, 155) },
          { property: "og:title", content: `${loaderData.title} — PASHAN` },
          { property: "og:description", content: loaderData.intention },
          { property: "og:image", content: loaderData.image },
        ]
      : [{ title: "Collection — PASHAN" }],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-luxe py-40 text-center">
        <div className="eyebrow">Not Found</div>
        <h1 className="mt-4 font-serif text-4xl">
          This collection could not be located.
        </h1>
        <Link to="/collections" className="btn-ghost mt-8 inline-flex">
          All Collections
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ reset }) => (
    <SiteLayout>
      <div className="container-luxe py-40 text-center">
        <h1 className="font-serif text-3xl">Something went wrong.</h1>
        <button onClick={reset} className="btn-ghost mt-8">
          Try Again
        </button>
      </div>
    </SiteLayout>
  ),
  component: CollectionPage,
});

function CollectionPage() {
  const c = Route.useLoaderData();
  const { add } = useCart();
  const related = collections.filter((x) => x.slug !== c.slug).slice(0, 3);

  return (
    <SiteLayout>
      <section className="container-luxe pt-8">
        <Link
          to="/collections"
          className="text-[0.7rem] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
        >
          ← All Collections
        </Link>
      </section>

      <section className="container-luxe pt-10 pb-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="relative aspect-square bg-[color:var(--surface)] overflow-hidden">
            <img
              src={c.image}
              alt={`${c.stone} bracelet`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="lg:py-8">
            <div className="eyebrow">{c.name} Collection</div>
            <h1 className="mt-5 font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[1.05]">
              {c.stone}{" "}
              <span className="italic text-[color:var(--gold)]">Bracelet</span>
            </h1>
            <p className="mt-5 text-lg text-[color:var(--gold)] italic">
              {c.intention}
            </p>

            <div className="hairline my-8 max-w-[8rem]" />

            <p className="text-[color:var(--muted-foreground)] leading-relaxed">
              {c.story}
            </p>

            <div className="mt-8">
              <div className="eyebrow">Traditionally Associated With</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.qualities.map((q: string) => (
                  <span
                    key={q}
                    className="border border-[color:var(--border)] px-4 py-2 text-xs tracking-[0.16em] uppercase text-[color:var(--muted-foreground)]"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10 flex items-baseline gap-4">
              <LaunchPrice price={c.price} compareAtPrice={c.compareAtPrice} />
              <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                {ritualKit.shortLabel}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() =>
                  add({
                    slug: c.slug,
                    name: c.title,
                    stone: c.stone,
                    price: c.price,
                    image: c.image,
                  })
                }
                className="btn-gold"
              >
                Add to Cart
              </button>
              <Link
                to="/products/$slug"
                params={{ slug: c.slug }}
                className="btn-ghost"
              >
                Product Details
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--surface)] py-24">
        <div className="container-luxe grid gap-12 md:grid-cols-2 lg:gap-20">
          <div>
            <div className="eyebrow">The Ritual</div>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl leading-tight">
              When to wear it.
            </h2>
            <p className="mt-6 text-[color:var(--muted-foreground)] leading-relaxed">
              {c.ritual}
            </p>
          </div>
          <div>
            <div className="eyebrow">The Stone</div>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl leading-tight">
              {c.stone}.
            </h2>
            <p className="mt-6 text-[color:var(--muted-foreground)] leading-relaxed">
              Long valued for its quiet symbolism, {c.stone.toLowerCase()} has
              historically been associated with{" "}
              {c.qualities.map((q: string) => q.toLowerCase()).join(", ")}.
              PASHAN selects each stone for natural quality and finishes each
              piece by hand.
            </p>
          </div>
        </div>
      </section>

      <section
        className="ritual-kit-summary container-luxe"
        aria-labelledby="collection-ritual-kit-title"
      >
        <p className="eyebrow">{ritualKit.shortLabel}</p>
        <h2 id="collection-ritual-kit-title">{ritualKit.headline}</h2>
        <p>{ritualKit.summary}</p>
        <Link to="/" hash="ritual-kit" className="text-link">
          See the ritual kit →
        </Link>
      </section>

      <section className="container-luxe pb-32">
        <div className="eyebrow">Other Collections</div>
        <h2 className="mt-3 font-serif text-3xl md:text-4xl">
          Continue exploring.
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {related.map((r) => (
            <Link
              key={r.slug}
              to="/collections/$slug"
              params={{ slug: r.slug }}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--surface)]">
                <img
                  src={r.image}
                  alt={r.stone}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-[0.65rem] uppercase tracking-[0.24em] text-[color:var(--gold)]">
                    {r.name}
                  </div>
                  <div className="font-heading text-lg mt-1">{r.stone}</div>
                </div>
                <LaunchPrice
                  price={r.price}
                  compareAtPrice={r.compareAtPrice}
                  compact
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
