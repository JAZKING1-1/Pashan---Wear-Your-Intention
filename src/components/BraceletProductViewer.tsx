import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import type { Collection } from "@/data/products";
import { productPreviewConfigs } from "@/data/bracelet-assets";
import { useAtelierCopy } from "@/data/atelier-copy";
import "@/styles-atelier.css";
const Scene = lazy(() =>
  import("./BraceletScene3D").then((m) => ({ default: m.BraceletScene3D })),
);
const ViewerContext = createContext<
  (p: Collection, trigger: HTMLElement) => void
>(() => {});
export const useProductViewer = () => useContext(ViewerContext);
export function ProductViewerProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Collection | null>(null);
  const [image, setImage] = useState(0);
  const trigger = useRef<HTMLElement | null>(null);
  const { a, locale } = useAtelierCopy();
  const config = product ? productPreviewConfigs[product.slug] : null;
  return (
    <ViewerContext.Provider
      value={(p, t) => {
        trigger.current = t;
        setImage(0);
        setProduct(p);
      }}
    >
      {children}
      <Dialog.Root
        open={!!product}
        onOpenChange={(open) => {
          if (!open) setProduct(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="atelier-modal-overlay" />
          <Dialog.Content
            className="atelier-modal"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              trigger.current?.focus();
            }}
          >
            <Dialog.Title>{product?.stone}</Dialog.Title>
            <Dialog.Description>{a("variation")}</Dialog.Description>
            <Dialog.Close
              className="atelier-modal-close"
              aria-label={a("closeViewer")}
            >
              ×
            </Dialog.Close>
            {product &&
              (config ? (
                <Suspense
                  fallback={
                    <img
                      src={product.images[0]}
                      alt={product.stone}
                      width={720}
                      height={1280}
                    />
                  }
                >
                  <Scene beads={config.beads} initialView="collection" />
                </Suspense>
              ) : (
                <div className="atelier-gallery">
                  <img
                    src={product.images[image]}
                    alt={product.imageAlts[image] ?? product.stone}
                  />
                  <div className="atelier-gallery-controls">
                    {product.images.map((src, i) => (
                      <button
                        key={src}
                        aria-label={a("photos") + " " + (i + 1)}
                        aria-pressed={image === i}
                        onClick={() => setImage(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            {product && (
              <>
                <p>
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(product.price)}
                </p>
                <Link
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className="atelier-card-action"
                  onClick={() => setProduct(null)}
                >
                  {a(product.isCustom ? "create" : "explore")} →
                </Link>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ViewerContext.Provider>
  );
}
