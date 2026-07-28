import { Link } from "@tanstack/react-router";
import { BrandMark, PashanSymbol } from "./BrandMark";

const WHATSAPP_URL =
  "https://wa.me/447767956428?text=Namaste%20Pashan%2C%20I%20would%20like%20help%20with%20a%20bracelet.";

export function Footer() {
  return (
    <footer className="site-footer bg-bg-dark text-ivory py-16">
      <div className="footer-aura" aria-hidden>
        <PashanSymbol />
      </div>
      <div className="container-luxe mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="footer-house">
          <BrandMark />
          <p className="mt-4 text-muted-brown">
            Natural-stone jewellery shaped by Himalayan calm, Indian craft, and
            the intentions we choose to carry.
          </p>
          <div className="mt-4 text-gold-soft">
            Himalayan inspired. Handmade in India.
          </div>
          <a
            className="block mt-4 text-gold hover:text-gold-soft transition-colors"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp: 07767 956428
          </a>
        </div>
        {[
          [
            "Discover",
            [
              ["Seven stones + custom", "/collections"],
              ["Create your own bracelet", "/collections/make-your-own"],
              ["Stone finder", "/stone-finder"],
              ["Shop by Rashi", "/rashi"],
              ["Rituals", "/rituals"],
            ],
          ],
          [
            "The house",
            [
              ["Our story", "/about"],
              ["Journal", "/journal"],
              ["Contact us", "/contact"],
            ],
          ],
          [
            "Client care",
            [
              ["Your bag", "/cart"],
              ["Track your order", "/track-order"],
              ["Delivery help", "/contact"],
              ["Care guide", "/rituals"],
              ["Returns", "/contact"],
            ],
          ],
        ].map(([title, links]) => (
          <div key={title as string}>
            <div className="uppercase tracking-widest text-gold text-sm mb-6">
              {title as string}
            </div>
            <ul className="space-y-4">
              {(links as string[][]).map(([label, to]) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-ivory hover:text-gold-soft transition-colors text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-luxe mx-auto mt-16 pt-8 border-t border-muted-brown text-center text-muted-brown text-xs">
        <p>© {new Date().getFullYear()} PASHAN · Haridwar, Uttarakhand</p>
        <p className="mt-2">
          Natural stones, described by traditional associations. No medical
          claims.
        </p>
      </div>
    </footer>
  );
}
