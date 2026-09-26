import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { SiteLayout } from "@/components/SiteLayout";
import { formatPrice, useCart } from "@/lib/cart";
import { ritualKit } from "@/data/ritual-kit";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/lib/razorpay.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — PASHAN" },
      { name: "description", content: "Complete your PASHAN order." },
    ],
  }),
  component: CheckoutPage,
});

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type PaymentStatus = "idle" | "opening" | "verifying" | "paid" | "failed";

interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: "payment.failed",
    callback: (response: RazorpayFailureResponse) => void,
  ) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
    backdrop_color: string;
  };
  modal: {
    backdropclose: boolean;
    confirm_close: boolean;
    escape: boolean;
    ondismiss: () => void;
  };
  retry: {
    enabled: boolean;
  };
  handler: (response: RazorpayCheckoutResponse) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function CheckoutPage() {
  const {
    lines,
    subtotal,
    discount,
    total,
    offerCode,
    count,
    clear,
    clearOffer,
  } = useCart();
  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);
  const [placed, setPlaced] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmedPaymentId, setConfirmedPaymentId] = useState<string | null>(
    null,
  );

  const isWorking = status === "opening" || status === "verifying";

  async function handleRazorpayCheckout(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setNotice(null);
    setConfirmedPaymentId(null);

    if (lines.length === 0) {
      setStatus("failed");
      setNotice("Your cart is empty. Add a bracelet before opening checkout.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const customer = getCustomerFromForm(formData);

    try {
      setStatus("opening");
      await loadRazorpayCheckoutScript();

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay checkout could not be loaded. Please refresh and try again.",
        );
      }

      const order = await createOrder({
        data: {
          lines: lines.map((line) => ({ slug: line.slug, qty: line.qty })),
          customer,
          offerCode: offerCode ?? undefined,
        },
      });

      let paymentCompletedOrVerifying = false;
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PASHAN",
        description: `${order.display.count} handcrafted ${order.display.count === 1 ? "bracelet" : "bracelets"}`,
        order_id: order.orderId,
        prefill: customer,
        notes: {
          brand: "PASHAN",
          source: "website_checkout",
          items: order.display.items
            .map((item) => `${item.slug}x${item.qty}`)
            .join(","),
        },
        theme: {
          color: "#C7A75A",
          backdrop_color: "#080706",
        },
        modal: {
          backdropclose: false,
          confirm_close: true,
          escape: true,
          ondismiss: () => {
            if (!paymentCompletedOrVerifying) {
              setStatus("failed");
              setNotice("Payment was cancelled. Your cart is still saved.");
            }
          },
        },
        retry: {
          enabled: true,
        },
        handler: (response) => {
          paymentCompletedOrVerifying = true;
          setStatus("verifying");
          setNotice(
            "Payment received by Razorpay. Verifying securely with PASHAN…",
          );

          void verifyPayment({
            data: {
              orderId: order.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            },
          })
            .then((result) => {
              setConfirmedPaymentId(result.paymentId);
              setStatus("paid");
              setPlaced(true);
              clear();
              clearOffer();
            })
            .catch((error: unknown) => {
              setStatus("failed");
              setNotice(getErrorMessage(error));
            });
        },
      });

      checkout.on("payment.failed", (response) => {
        const description =
          response.error?.description ??
          response.error?.reason ??
          "The payment attempt failed. You can try again securely with Razorpay.";
        setStatus("failed");
        setNotice(description);
      });

      checkout.open();
    } catch (error: unknown) {
      setStatus("failed");
      setNotice(getErrorMessage(error));
    }
  }

  if (lines.length === 0 && !placed) {
    return (
      <SiteLayout>
        <section className="container-luxe py-32 text-center">
          <div className="eyebrow">Checkout</div>
          <h1 className="mt-4 font-serif text-3xl">
            There is nothing to check out.
          </h1>
          <Link to="/collections" className="btn-gold mt-8 inline-flex">
            Browse Collections
          </Link>
        </section>
      </SiteLayout>
    );
  }

  if (placed) {
    return (
      <SiteLayout>
        <section className="container-luxe mx-auto max-w-2xl py-32 text-center">
          <div className="eyebrow">Order Received</div>
          <h1 className="mt-5 font-serif text-[clamp(2rem,4vw,3.5rem)]">
            Thank you.{" "}
            <span className="italic text-[color:var(--gold)]">
              Your piece is being prepared.
            </span>
          </h1>
          <p className="mt-6 leading-relaxed text-[color:var(--muted-foreground)]">
            Razorpay has confirmed your secure payment with PASHAN. Each order
            is composed by hand and dispatched with the premium presentation
            suite.
          </p>
          {confirmedPaymentId ? (
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
              Payment ID: {confirmedPaymentId}
            </p>
          ) : null}
          <Link to="/" className="btn-ghost mt-10 inline-flex">
            Return Home
          </Link>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container-luxe py-16 md:py-24">
        <div className="eyebrow">Checkout</div>
        <h1 className="mt-4 font-serif text-[clamp(2.25rem,5vw,4rem)]">
          Complete your order.
        </h1>
      </section>

      <section className="container-luxe pb-32">
        <form
          onSubmit={(event) => void handleRazorpayCheckout(event)}
          className="grid gap-16 lg:grid-cols-[1.4fr_1fr] lg:gap-20"
        >
          <div className="space-y-12">
            <Section title="Contact">
              <Field label="Email" name="email" type="email" />
              <Field label="Phone" name="phone" type="tel" />
            </Section>

            <Section title="Shipping">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="First name" name="first" />
                <Field label="Last name" name="last" />
              </div>
              <Field label="Address" name="address" />
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="City" name="city" />
                <Field label="Postal Code" name="postal" />
                <Field label="Country" name="country" />
              </div>
            </Section>

            <Section title="Payment">
              <div className="space-y-5 border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
                <div>
                  <div className="eyebrow text-[color:var(--gold)]">
                    Razorpay Standard Checkout
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted-foreground)]">
                    PASHAN never collects or stores your card details. Cards,
                    UPI, netbanking and wallet options open inside Razorpay's
                    secure hosted checkout.
                  </p>
                </div>

                {notice ? (
                  <div
                    className={`border p-4 text-sm leading-relaxed ${
                      status === "verifying"
                        ? "border-[color:var(--gold)] text-[color:var(--gold)]"
                        : "border-red-400/40 text-red-200"
                    }`}
                    role={status === "failed" ? "alert" : "status"}
                  >
                    {notice}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="btn-gold w-full"
                  disabled={isWorking}
                >
                  {status === "verifying"
                    ? "Verifying payment…"
                    : status === "opening"
                      ? "Opening Razorpay…"
                      : "Pay securely with Razorpay"}
                </button>
                <p className="text-center text-xs uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  Total due today: {formatPrice(total)}
                </p>
              </div>
            </Section>

            <p className="text-center text-xs text-[color:var(--muted-foreground)]">
              By placing your order you agree to PASHAN's terms. Your data is
              handled with discretion.
            </p>
          </div>

          <aside className="self-start border border-[color:var(--border)] bg-[color:var(--surface)] p-8">
            <div className="eyebrow">Order Summary</div>
            <ul className="mt-6 divide-y divide-[color:var(--border)]">
              {lines.map((line) => (
                <li key={line.slug} className="flex gap-4 py-4">
                  <img
                    src={line.image}
                    alt={line.name}
                    className="h-20 w-20 object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <div className="text-[0.65rem] uppercase tracking-[0.24em] text-[color:var(--gold)]">
                      {line.stone}
                    </div>
                    <div className="mt-1 font-heading text-base">
                      {line.name}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                      Qty {line.qty}
                    </div>
                  </div>
                  <div className="text-sm">
                    {formatPrice(line.price * line.qty)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 text-sm">
              <Row
                label={`Subtotal · ${count} ${count === 1 ? "piece" : "pieces"}`}
                value={formatPrice(subtotal)}
              />
              {discount > 0 ? (
                <Row
                  label={`Offer · ${offerCode}`}
                  value={`-${formatPrice(discount)}`}
                  gold
                />
              ) : null}
              <Row label="Standard shipping" value="Complimentary" gold />
              <Row label={ritualKit.shortLabel} value="Included" gold />
            </div>
            <div className="hairline my-6" />
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Total</span>
              <span className="font-serif text-2xl">{formatPrice(total)}</span>
            </div>
            <div className="mt-6 border border-[color:var(--border)] p-4 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
              {ritualKit.summary}{" "}
              <Link
                to="/"
                hash="ritual-kit"
                className="inline-flex min-h-11 items-center underline underline-offset-4"
              >
                See the ritual kit →
              </Link>
            </div>
          </aside>
        </form>
      </section>
    </SiteLayout>
  );
}

function loadRazorpayCheckoutScript() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Razorpay checkout is available in the browser only."),
    );
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_CHECKOUT_SCRIPT}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Razorpay checkout could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Razorpay checkout could not be loaded."));
    document.body.appendChild(script);
  });
}

function getCustomerFromForm(formData: FormData) {
  const firstName = getFormValue(formData, "first");
  const lastName = getFormValue(formData, "last");

  return {
    name: [firstName, lastName].filter(Boolean).join(" "),
    email: getFormValue(formData, "email"),
    contact: getFormValue(formData, "phone"),
  };
}

function getFormValue(formData: FormData, name: string) {
  return formData.get(name)?.toString().trim() ?? "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Payment could not be completed. Please try again.";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="eyebrow">{title}</div>
        <div className="h-px flex-1 bg-[color:var(--border)]" />
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="eyebrow mb-2 block">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        className="w-full border border-[color:var(--border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[color:var(--gold)]"
      />
    </div>
  );
}

function Row({
  label,
  value,
  gold,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-[color:var(--muted-foreground)]">{label}</span>
      <span className={gold ? "text-[color:var(--gold)]" : ""}>{value}</span>
    </div>
  );
}
