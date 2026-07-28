import { LuxurySearchOverlay } from "./LuxurySearchOverlay";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  Compass,
  Gem,
  Home,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart";
import { BrandMark, PashanSymbol } from "./BrandMark";
import { MegaMenu } from "./MegaMenu";
import { CartDrawer } from "./CartDrawer";
import { WhatsAppConcierge } from "./WhatsAppConcierge";
import { WisdomCirclePopup } from "./WisdomCirclePopup";

const WHATSAPP_URL =
  "https://wa.me/447767956428?text=Namaste%20Pashan%2C%20I%20would%20like%20help%20with%20a%20bracelet.";

const SHOP_BY_STONE = [
  { to: "/collections/tiger-eye", label: "Tiger Eye" },
  { to: "/collections/pyrite", label: "Pyrite" },
  { to: "/collections/amethyst", label: "Amethyst" },
  { to: "/collections/green-quartz", label: "Green Quartz" },
  { to: "/collections/pyrite", label: "Citrine" },
  { to: "/collections/lava", label: "Lava" },
  { to: "/collections/hematite", label: "Hematite" },
  { to: "/collections", label: "Black Onyx" },
] as const;

const SHOP_BY_INTENTION = [
  { to: "/collections/tiger-eye", label: "Leadership" },
  { to: "/collections/pyrite", label: "Prosperity" },
  { to: "/collections/green-quartz", label: "Growth" },
  { to: "/collections/hematite", label: "Focus" },
  { to: "/collections/tiger-eye", label: "Protection" },
  { to: "/collections/dhan-yog", label: "Balance" },
  { to: "/rituals", label: "Healing" },
] as const;

const DISCOVER_LINKS = [
  { to: "/track-order", label: "Track your order" },
  { to: "/rituals", label: "Rituals & care" },
  { to: "/journal", label: "Journal" },
  { to: "/contact", label: "Contact us" },
] as const;

function Header() {
  const { count, setOpen } = useCart();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShopOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const menu = mobileMenuRef.current;
    const menuButton = menuButtonRef.current;
    const focusable = Array.from(
      menu?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ??
        [],
    );
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      menuButton?.focus();
    };
  }, [mobileOpen]);

  return (
    <header
      className={`site-header ${scrolled ? "is-scrolled" : ""}`}
      onMouseLeave={() => setShopOpen(false)}
    >
      <div className="announcement-bar">
        <div className="announcement-marquee" aria-label="Opening offer">
          <span>
            Opening offer: Rs 899, was Rs 1,500
            <i aria-hidden />
            Free-size natural stone bracelets
          </span>
        </div>
        <Link to="/track-order" className="announcement-track-link">
          Track your order
        </Link>
      </div>
      <div className="container-luxe header-inner">
        <BrandMark />
        <nav className="header-nav" aria-label="Main navigation">
          <MegaMenu />
          <Link to="/rakhi" className="header-link">
            Rakhi Collection
          </Link>
          <Link
            to="/products/$slug"
            params={{ slug: "make-your-own" }}
            className="header-link"
          >
            Craft Your Bracelet
          </Link>
          <Link to="/find-your-bracelet" className="header-link">
            Find Your Stone
          </Link>
          <Link to="/collections" className="header-link">
            Gifts
          </Link>
          <Link to="/about" className="header-link">
            Our Story
          </Link>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="icon-action"
            aria-label="Search PASHAN"
            title="Search"
          >
            <Search size={19} />
          </button>
          <Link
            to="/contact"
            className="icon-action account-action"
            aria-label="Contact PASHAN"
            title="Contact"
          >
            <UserRound size={19} />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="icon-action cart-trigger"
            aria-label={`Open bag with ${count} ${count === 1 ? "item" : "items"}`}
            title="Your bag"
          >
            <ShoppingBag size={19} />
            {count > 0 ? <span>{count}</span> : null}
          </button>
          <button
            type="button"
            ref={menuButtonRef}
            className="menu-trigger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-controls="mobile-navigation"
            aria-expanded={mobileOpen}
            title="Menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <LuxurySearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />

      {mobileOpen && (
        <>
          <button
            type="button"
            className="mobile-menu-overlay"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div
            id="mobile-navigation"
            ref={mobileMenuRef}
            className="mobile-menu is-open"
            role="dialog"
            aria-modal="true"
            aria-label="PASHAN menu"
          >
            <div className="mobile-menu-head">
              <BrandMark compact />
              <button
                type="button"
                className="icon-action"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                title="Close"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="mobile-nav" aria-label="Mobile navigation">
              <Link
                to="/products/$slug"
                params={{ slug: "make-your-own" }}
                className="mobile-personalise-link"
              >
                <WandSparkles aria-hidden size={18} />
                Create your own bracelet
              </Link>
              <div className="mobile-nav-quick">
                <Link to="/" onClick={() => setMobileOpen(false)}>
                  <Home aria-hidden size={18} />
                  Home
                </Link>
                <Link to="/collections" onClick={() => setMobileOpen(false)}>
                  <Gem aria-hidden size={18} />
                  Shop all
                </Link>
                <Link
                  to="/find-your-bracelet"
                  onClick={() => setMobileOpen(false)}
                >
                  <Compass aria-hidden size={18} />
                  Stone finder
                </Link>
              </div>
              <details className="mobile-nav-details">
                <summary>
                  Shop by stone
                  <ChevronDown aria-hidden size={18} />
                </summary>
                <div>
                  {SHOP_BY_STONE.map((item) => (
                    <Link
                      key={`${item.to}-${item.label}`}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
              <details className="mobile-nav-details">
                <summary>
                  Shop by intention
                  <ChevronDown aria-hidden size={18} />
                </summary>
                <div>
                  {SHOP_BY_INTENTION.map((item) => (
                    <Link
                      key={`${item.to}-${item.label}`}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
              <div className="mobile-nav-group mobile-nav-help">
                <span>Help and discover</span>
                {DISCOVER_LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link to="/about" onClick={() => setMobileOpen(false)}>
                  Our story
                </Link>
              </div>
            </nav>
            <div className="mobile-menu-foot">
              <p>Wear Your Intention</p>
              <small>Haridwar crafted · Natural stone · Gifting ready</small>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function MobileAppNav() {
  const { count, setOpen } = useCart();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isActive = (path: string) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="mobile-app-nav" aria-label="Quick navigation">
      <Link to="/" className={isActive("/") ? "is-active" : ""}>
        <Home aria-hidden size={20} />
        <span>Home</span>
      </Link>
      <Link
        to="/collections"
        className={
          isActive("/collections") || pathname.startsWith("/products/")
            ? "is-active"
            : ""
        }
      >
        <Gem aria-hidden size={20} />
        <span>Shop</span>
      </Link>
      <Link
        to="/find-your-bracelet"
        className={isActive("/find-your-bracelet") ? "is-active" : ""}
      >
        <Compass aria-hidden size={20} />
        <span>Find</span>
      </Link>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open bag with ${count} ${count === 1 ? "item" : "items"}`}
      >
        <span className="mobile-app-nav-icon">
          <ShoppingBag aria-hidden size={20} />
          {count > 0 ? <i>{count}</i> : null}
        </span>
        <span>Bag</span>
      </button>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-aura" aria-hidden>
        <PashanSymbol />
      </div>
      <div className="container-luxe footer-grid">
        <div className="footer-house">
          <BrandMark />
          <p>
            Natural-stone jewellery shaped by Himalayan calm, Indian craft, and
            the intentions we choose to carry.
          </p>
          <div className="footer-mantra">
            Himalayan inspired. Handmade in India.
          </div>
          <a
            className="footer-whatsapp"
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
              ["Create your own bracelet", "/products/make-your-own"],
              ["Stone finder", "/find-your-bracelet"],
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
          <div key={title as string} className="footer-column">
            <div className="eyebrow">{title as string}</div>
            <ul>
              {(links as string[][]).map(([label, to]) => (
                <li key={label}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-luxe footer-bottom">
        <p>© {new Date().getFullYear()} PASHAN · Haridwar, Uttarakhand</p>
        <p>
          Natural stones, described by traditional associations. No medical
          claims.
        </p>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <Header />
      <main className="site-main">{children}</main>
      <Footer />
      <MobileAppNav />
      <CartDrawer />
      <WhatsAppConcierge />
      <WisdomCirclePopup />
    </div>
  );
}
