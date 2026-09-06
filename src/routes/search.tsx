import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, type FormEvent } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { exploreProducts, searchCatalogue } from "@/lib/search";

const searchSchema = z.object({ q: z.string().catch("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — PASHAN" }] }),
  component: SearchPage,
});

export function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [draft, setDraft] = useState(q);
  const results = q.trim()
    ? searchCatalogue(q).map(({ product }) => product)
    : exploreProducts;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void navigate({ search: { q: draft.trim() } });
  };

  return (
    <SiteLayout>
      <main className="min-h-screen bg-[#FFF9F0] py-20 text-[#32170F]">
        <div className="container-luxe mx-auto">
          <p className="eyebrow">The PASHAN catalogue</p>
          <h1 className="mb-8 font-serif text-5xl">Find your stone.</h1>
          <form
            className="flex max-w-3xl border-b-2 border-[#32170F]"
            onSubmit={submit}
            role="search"
          >
            <label htmlFor="catalogue-search" className="sr-only">
              Search the catalogue
            </label>
            <input
              id="catalogue-search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Search stones, bracelets or intentions…"
              className="min-w-0 flex-1 bg-transparent p-4 text-lg outline-none"
            />
            <button
              type="submit"
              className="min-h-11 px-6 font-bold uppercase tracking-widest text-[#A3471C]"
            >
              Search
            </button>
          </form>
          <div className="mt-12 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">
                {q.trim() ? "Search results" : "Explore"}
              </p>
              <h2 className="font-serif text-3xl">
                {q.trim()
                  ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”`
                  : "A place to begin"}
              </h2>
            </div>
            {q && (
              <Link
                to="/search"
                search={{ q: "" }}
                className="text-sm underline"
              >
                Clear
              </Link>
            )}
          </div>
          {results.length ? (
            <div className="collection-grid-premium mt-8">
              {results.map((product, index) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-[#C96B38]/30 bg-[#F4DFCF] p-8">
              <h2 className="font-serif text-3xl">
                Nothing matched that wording.
              </h2>
              <p className="mt-2 text-[#6F5C52]">
                Try a stone name, an intention such as focus, or explore every
                bracelet.
              </p>
              <Link
                to="/collections"
                className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#EF7B2D] px-5 font-semibold"
              >
                Shop all bracelets
              </Link>
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}
