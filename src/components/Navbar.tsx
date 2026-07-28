import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Menu, X, User } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { useCart } from "@/lib/cart";
import { MegaMenu } from "./MegaMenu";

export function Navbar() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinkClass =
    "text-ivory text-sm uppercase tracking-[0.1em] hover:text-gold-soft transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-1/2 after:w-0 after:h-[1px] after:bg-gold after:transition-all after:duration-220 hover:after:left-0 hover:after:w-full";

  return (
    <header
      className={`sticky top-0 w-full z-[1000] transition-all duration-300 bg-[#2B160F] ${scrolled ? "backdrop-blur-md bg-[#2B160F]/95" : ""}`}
    >
      <div className="container-luxe mx-auto flex items-center justify-between h-[90px] border-b border-[#C8A15A]/30">
        <div className="h-[58px]">
          <BrandMark />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <MegaMenu />
          <Link
            to="/collections"
            className={navLinkClass}
            activeProps={{ className: "text-gold" }}
          >
            Collections
          </Link>
          <Link
            to="/rakhi"
            className={navLinkClass}
            activeProps={{ className: "text-gold" }}
          >
            Rakhi Collection
          </Link>
          <Link
            to="/find-your-bracelet"
            className={navLinkClass}
            activeProps={{ className: "text-gold" }}
          >
            Find Your Stone
          </Link>
          <Link
            to="/about"
            className={navLinkClass}
            activeProps={{ className: "text-gold" }}
          >
            Our Story
          </Link>
        </nav>

        <div className="flex items-center gap-6 text-ivory">
          <button
            className="hover:scale-105 transition-transform"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <a
            href="#"
            className="hover:scale-105 transition-transform account-action"
            aria-label="Account"
          >
            <User size={20} />
          </a>
          <button
            onClick={() => setOpen(true)}
            className="relative hover:scale-105 transition-transform"
            aria-label="Cart"
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold text-bg-dark text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-[#2B160F] z-50 p-6 flex flex-col md:hidden">
          <button
            className="self-end text-ivory mb-12"
            onClick={() => setMobileOpen(false)}
            aria-label="Close Menu"
          >
            <X size={24} />
          </button>
          <nav className="flex flex-col gap-6 text-ivory text-xl">
            <Link to="/collections" onClick={() => setMobileOpen(false)}>
              Shop
            </Link>
            <Link to="/rakhi" onClick={() => setMobileOpen(false)}>
              Rakhi Collection
            </Link>
            <Link to="/find-your-bracelet" onClick={() => setMobileOpen(false)}>
              Find Your Stone
            </Link>
            <Link to="/about" onClick={() => setMobileOpen(false)}>
              Our Story
            </Link>
            <a href="#" onClick={() => setMobileOpen(false)}>
              Account
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
