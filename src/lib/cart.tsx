import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { collections } from "@/data/products";
import {
  BASKET_OFFER_CODE,
  BASKET_OFFER_MINIMUM,
  WELCOME_OFFER_CODE,
  calculateOfferDiscount,
  normalizeOfferCode,
  type OfferCode,
} from "./offers";

export interface CartLine {
  slug: string;
  lineId?: string;
  productSlug?: string;
  name: string;
  stone: string;
  price: number;
  image: string;
  qty: number;
}

interface CartCtx {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  offerCode: OfferCode | null;
  applyOffer: (code: string) => { success: boolean; message: string };
  clearOffer: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "pashan-cart-v1";
const OFFER_STORAGE_KEY = "pashan-offer-v1";
const currentPrices = new Map(
  collections.map((product) => [product.slug, product.price]),
);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [offerCode, setOfferCode] = useState<OfferCode | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (raw) {
        const saved = JSON.parse(raw) as CartLine[];
        setLines(
          saved.map((line) => ({
            ...line,
            price: currentPrices.get(line.slug) ?? line.price,
          })),
        );
      }
      const savedOffer = window.localStorage.getItem(OFFER_STORAGE_KEY);
      setOfferCode(normalizeOfferCode(savedOffer));
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
  }, [lines, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (offerCode) window.localStorage.setItem(OFFER_STORAGE_KEY, offerCode);
      else window.localStorage.removeItem(OFFER_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
  }, [offerCode, ready]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((cur) => {
      const identity = line.lineId ?? line.slug;
      const existing = cur.find((l) => (l.lineId ?? l.slug) === identity);
      if (existing) {
        return cur.map((l) =>
          (l.lineId ?? l.slug) === identity ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...cur, { ...line, qty }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((cur) => cur.filter((l) => l.slug !== slug));
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setLines((cur) =>
      cur
        .map((l) => (l.slug === slug ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const applyOffer = useCallback((value: string) => {
    const code = normalizeOfferCode(value);
    if (!code) {
      return { success: false, message: "That offer code is not recognised." };
    }
    setOfferCode(code);
    if (code === WELCOME_OFFER_CODE) {
      return { success: true, message: "Your 10% welcome offer is active." };
    }
    return {
      success: true,
      message: `Your ₹200 offer is saved and activates at ₹${BASKET_OFFER_MINIMUM.toLocaleString("en-IN")}.`,
    };
  }, []);

  const clearOffer = useCallback(() => setOfferCode(null), []);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const l of lines) {
      c += l.qty;
      s += l.qty * l.price;
    }
    return { count: c, subtotal: s };
  }, [lines]);

  const discount = calculateOfferDiscount(subtotal, offerCode);
  const total = Math.max(0, subtotal - discount);
  const value: CartCtx = {
    lines,
    add,
    remove,
    setQty,
    clear,
    count,
    subtotal,
    discount,
    total,
    offerCode,
    applyOffer,
    clearOffer,
    open,
    setOpen,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
