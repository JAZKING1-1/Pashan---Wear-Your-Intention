import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { formatPrice, useCart } from "@/lib/cart";
import { OfferCodeEntry } from "@/components/OfferCodeEntry";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — PASHAN" },
      { name: "description", content: "Your PASHAN selection." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove, subtotal, discount, total, count } = useCart();

  return (
    <SiteLayout>
      <section className="container-luxe py-16 md:py-24">
        <div className="eyebrow">Your bag</div>
        <h1 className="mt-4 font-serif text-[clamp(2.25rem,5vw,4rem)]">
          Your bracelets
        </h1>
      </section>

      <section className="container-luxe pb-32">
        {lines.length === 0 ? (
          <div className="border border-[color:var(--border)] bg-[color:var(--surface)] p-16 text-center">
            <p className="font-serif text-2xl">Your cart is quiet for now.</p>
            <Link to="/collections" className="btn-gold mt-8 inline-flex">
              Explore Collections
            </Link>
          </div>
        ) : (
          <div className="grid gap-16 lg:grid-cols-[2fr_1fr] lg:gap-20">
            <div className="border-t border-[color:var(--border)]">
              {lines.map((l) => (
                <div
                  key={l.slug}
                  className="grid grid-cols-[120px_1fr_auto] gap-6 py-8 border-b border-[color:var(--border)]"
                >
                  <img
                    src={l.image}
                    alt={l.name}
                    className="h-28 w-28 object-cover"
                    loading="lazy"
                  />
                  <div>
                    <div className="text-[0.65rem] uppercase tracking-[0.24em] text-[color:var(--gold)]">
                      {l.stone}
                    </div>
                    <div className="font-serif text-xl mt-1">{l.name}</div>
                    <button
                      onClick={() => remove(l.lineId ?? l.slug)}
                      className="mt-4 text-[0.65rem] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm">
                      {formatPrice(l.price * l.qty)}
                    </span>
                    <div className="flex items-center border border-[color:var(--border)]">
                      <button
                        onClick={() => setQty(l.lineId ?? l.slug, l.qty - 1)}
                        className="px-3 py-1 text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="px-3 text-sm">{l.qty}</span>
                      <button
                        onClick={() => setQty(l.lineId ?? l.slug, l.qty + 1)}
                        className="px-3 py-1 text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="border border-[color:var(--border)] bg-[color:var(--surface)] p-8 self-start">
              <div className="eyebrow">Order Summary</div>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted-foreground)]">
                    Subtotal · {count} {count === 1 ? "piece" : "pieces"}
                  </span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-[color:var(--gold)]">
                    <span>Offer saving</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted-foreground)]">
                    Standard shipping
                  </span>
                  <span className="text-[color:var(--gold)]">
                    Complimentary
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted-foreground)]">
                    Ganga Jal Inclusion
                  </span>
                  <span className="text-[color:var(--gold)]">Included</span>
                </div>
              </div>
              <OfferCodeEntry />
              <div className="hairline my-6" />
              <div className="flex justify-between items-baseline">
                <span className="eyebrow">Total</span>
                <span className="font-serif text-2xl">
                  {formatPrice(total)}
                </span>
              </div>
              <Link to="/checkout" className="btn-gold w-full mt-8">
                Proceed to Checkout
              </Link>
              <Link
                to="/collections"
                className="block text-center text-[0.7rem] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)] mt-4"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
