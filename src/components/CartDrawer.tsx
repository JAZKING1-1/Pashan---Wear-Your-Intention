import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { formatPrice, useCart } from "@/lib/cart";
import { OfferCodeEntry } from "./OfferCodeEntry";

export function CartDrawer() {
  const {
    open,
    setOpen,
    lines,
    setQty,
    remove,
    subtotal,
    discount,
    total,
    count,
  } = useCart();

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />
      <aside
        className={`fixed right-0 top-0 z-[81] h-full w-full max-w-md bg-[color:var(--surface)] border-l border-[color:var(--border)] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Cart"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-8 py-6">
            <div>
              <div className="eyebrow">Your bag</div>
              <h2 className="font-serif text-2xl mt-1">Your bracelets</h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[0.7rem] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {lines.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="eyebrow mb-3">Quiet for now</div>
                <p className="font-serif text-2xl">
                  Your cart awaits intention.
                </p>
                <Link
                  to="/collections"
                  onClick={() => setOpen(false)}
                  className="btn-ghost mt-8"
                >
                  Explore Collections
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--border)]">
                {lines.map((l) => (
                  <li key={l.slug} className="flex gap-5 py-6">
                    <img
                      src={l.image}
                      alt={l.name}
                      loading="lazy"
                      className="h-24 w-24 object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold)]">
                          {l.stone}
                        </div>
                        <div className="font-serif text-lg mt-1">{l.name}</div>
                      </div>
                      <div className="flex items-center justify-between">
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
                        <div className="text-sm">
                          {formatPrice(l.price * l.qty)}
                        </div>
                      </div>
                      <button
                        onClick={() => remove(l.lineId ?? l.slug)}
                        className="mt-2 self-start text-[0.65rem] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lines.length > 0 && (
            <div className="border-t border-[color:var(--border)] px-8 py-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
                  Subtotal · {count} {count === 1 ? "piece" : "pieces"}
                </span>
                <span className="font-serif text-2xl">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <OfferCodeEntry compact />
              {discount > 0 ? (
                <div className="cart-offer-total">
                  <span>Offer saving</span>
                  <strong>-{formatPrice(discount)}</strong>
                </div>
              ) : null}
              <div className="cart-grand-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <p className="text-xs text-[color:var(--muted-foreground)] mb-5">
                Each order includes a complimentary bottle of Ganga Jal and the
                PASHAN presentation suite.
              </p>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className="btn-gold w-full"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="block text-center text-[0.7rem] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)] mt-4"
              >
                View Cart
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
