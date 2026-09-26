import { Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatPrice, useCart } from "@/lib/cart";
import { ritualKit } from "@/data/ritual-kit";
import { OfferCodeEntry } from "./OfferCodeEntry";
import "@/styles-cart-drawer.css";

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
  const openerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Keyboards can reduce the visual viewport without changing 100dvh.
  // Keep offers and totals in the same scroll area as the bag's contents.
  useEffect(() => {
    if (!open || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const resize = () => {
      drawerRef.current?.style.setProperty(
        "--bag-visible-height",
        `${viewport.height}px`,
      );
      drawerRef.current?.style.setProperty(
        "--bag-visible-top",
        `${viewport.offsetTop}px`,
      );
    };
    const frame = requestAnimationFrame(resize);
    viewport.addEventListener("resize", resize);
    viewport.addEventListener("scroll", resize);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", resize);
      viewport.removeEventListener("scroll", resize);
    };
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="bag-dialog-overlay" />
        <Dialog.Content
          ref={drawerRef}
          className="bag-dialog"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const active = document.activeElement;
            openerRef.current =
              active instanceof HTMLElement &&
              active !== document.body &&
              !drawerRef.current?.contains(active)
                ? active
                : null;
            closeRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const opener = openerRef.current;
            if (opener?.isConnected) opener.focus({ preventScroll: true });
            else
              document
                .getElementById("pashan-bag-trigger")
                ?.focus({ preventScroll: true });
          }}
        >
          <header className="bag-dialog-header">
            <div>
              <p className="bag-dialog-eyebrow">Your bag</p>
              <Dialog.Title className="bag-dialog-title">
                Your bracelets
              </Dialog.Title>
              <Dialog.Description className="bag-dialog-sr-only">
                Review your pieces, adjust quantities and continue to checkout.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                ref={closeRef}
                type="button"
                className="bag-dialog-close"
                aria-label="Close bag"
              >
                <X aria-hidden="true" size={22} />
              </button>
            </Dialog.Close>
          </header>

          <div className="bag-dialog-scroll">
            {lines.length === 0 ? (
              <div className="bag-dialog-empty">
                <p className="bag-dialog-eyebrow">Quiet for now</p>
                <p className="bag-dialog-empty-title">
                  Your cart awaits intention.
                </p>
                <Link
                  to="/collections"
                  onClick={() => setOpen(false)}
                  className="bag-dialog-secondary"
                >
                  Explore Collections
                </Link>
              </div>
            ) : (
              <>
                <ul className="bag-dialog-lines">
                  {lines.map((line, index) => (
                    <li
                      key={line.lineId ?? line.slug}
                      className="bag-dialog-line"
                    >
                      <img
                        src={line.image}
                        alt=""
                        width="80"
                        height="100"
                        loading="lazy"
                        className="bag-dialog-image"
                      />
                      <div className="bag-dialog-line-info">
                        <p className="bag-dialog-stone">{line.stone}</p>
                        <h3 className="bag-dialog-product">{line.name}</h3>
                        <div className="bag-dialog-line-controls">
                          <div
                            className="bag-dialog-quantity"
                            role="group"
                            aria-label={`Quantity for ${line.name}, item ${index + 1}`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setQty(line.lineId ?? line.slug, line.qty - 1)
                              }
                              aria-label={`Decrease quantity of ${line.name}, item ${index + 1}`}
                            >
                              −
                            </button>
                            <span aria-label={`Quantity ${line.qty}`}>
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQty(line.lineId ?? line.slug, line.qty + 1)
                              }
                              aria-label={`Increase quantity of ${line.name}, item ${index + 1}`}
                            >
                              +
                            </button>
                          </div>
                          <p className="bag-dialog-price">
                            {formatPrice(line.price * line.qty)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(line.lineId ?? line.slug)}
                          className="bag-dialog-remove"
                          aria-label={`Remove ${line.name}, item ${index + 1}, from bag`}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="bag-dialog-summary">
                  <div className="bag-dialog-subtotal">
                    <span>
                      Subtotal · {count} {count === 1 ? "piece" : "pieces"}
                    </span>
                    <strong>{formatPrice(subtotal)}</strong>
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
                  <p className="bag-dialog-presentation">
                    <strong>{ritualKit.shortLabel}.</strong> {ritualKit.summary}{" "}
                    <Link
                      to="/"
                      hash="ritual-kit"
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-11 items-center underline underline-offset-4"
                    >
                      See the ritual kit →
                    </Link>
                  </p>
                  <Link
                    to="/checkout"
                    onClick={() => setOpen(false)}
                    className="bag-dialog-checkout"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setOpen(false)}
                    className="bag-dialog-secondary"
                  >
                    View Cart
                  </Link>
                </div>
              </>
            )}
            <p role="status" className="bag-dialog-sr-only">
              {count} {count === 1 ? "piece" : "pieces"} in your bag. Total{" "}
              {formatPrice(total)}.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
