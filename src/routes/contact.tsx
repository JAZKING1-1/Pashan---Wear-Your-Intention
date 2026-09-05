import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { WeeklyWisdomSignup } from "@/components/WeeklyWisdomSignup";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — PASHAN" },
      {
        name: "description",
        content:
          "Reach the PASHAN support team for product, gifting, custom bracelet, delivery, or order help.",
      },
      { property: "og:title", content: "Contact Us — PASHAN" },
      {
        property: "og:description",
        content: "Talk directly with the PASHAN customer support team.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <SiteLayout>
      <section className="container-luxe pt-16 pb-12">
        <div className="max-w-3xl">
          <div className="eyebrow">Customer care</div>
          <h1 className="mt-5 font-serif text-[clamp(2.5rem,6vw,5rem)] leading-[1.02]">
            Reach out to{" "}
            <span className="italic text-[color:var(--gold)]">us.</span>
          </h1>
          <p className="mt-8 text-lg text-[color:var(--muted-foreground)] leading-relaxed max-w-xl">
            Questions about a bracelet, gifting, a custom design, delivery, or
            an existing order? Send us a message. A real member of our team will
            reply and keep you updated.
          </p>
        </div>
      </section>

      <section className="container-luxe pb-32">
        <div className="grid gap-16 md:grid-cols-[1fr_1.4fr] md:gap-20">
          <div className="space-y-8">
            <div>
              <div className="eyebrow">Email our team</div>
              <a
                href="mailto:atelier@pashan.house"
                className="block mt-2 text-lg hover:text-[color:var(--gold)]"
              >
                atelier@pashan.house
              </a>
            </div>
            <div>
              <div className="eyebrow">WhatsApp</div>
              <a
                href="https://wa.me/447767956428?text=Namaste%20Pashan%2C%20I%20would%20like%20some%20help."
                target="_blank"
                rel="noreferrer"
                className="block mt-2 text-lg hover:text-[color:var(--gold)]"
              >
                07767 956428
              </a>
            </div>
            <div>
              <div className="eyebrow">Support hours</div>
              <p className="mt-2 text-[color:var(--muted-foreground)]">
                Mon — Sat · 09:00 — 19:00 IST
              </p>
            </div>
            <div>
              <div className="eyebrow">Visit us</div>
              <p className="mt-2 text-[color:var(--muted-foreground)]">
                Haridwar · By appointment
              </p>
            </div>
            <div>
              <div className="eyebrow">Delivery & returns</div>
              <p className="mt-2 text-[color:var(--muted-foreground)] leading-relaxed">
                We confirm delivery timing and keep you informed after dispatch.
                Unworn pieces can be returned within 14 days in their original
                presentation.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-5 border border-[color:var(--border)] bg-[color:var(--surface)] p-8 md:p-12"
          >
            <div className="eyebrow">Send us a message</div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Your name" name="name" />
              <Field label="Email" name="email" type="email" />
            </div>
            <Field label="Subject" name="subject" />
            <div>
              <label className="block eyebrow mb-2">Message</label>
              <textarea
                required
                rows={6}
                className="w-full bg-transparent border border-[color:var(--border)] px-4 py-3 text-sm focus:border-[color:var(--gold)] outline-none"
              />
            </div>
            <button type="submit" className="btn-gold w-full">
              Send Message
            </button>
            {sent && (
              <p className="text-sm text-[color:var(--gold)] mt-2">
                Thank you — our team will get back to you personally.
              </p>
            )}
          </form>
        </div>
      </section>
      <div className="container-luxe pb-28">
        <WeeklyWisdomSignup compact />
      </div>
    </SiteLayout>
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
      <label htmlFor={name} className="block eyebrow mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        className="w-full bg-transparent border border-[color:var(--border)] px-4 py-3 text-sm focus:border-[color:var(--gold)] outline-none"
      />
    </div>
  );
}
