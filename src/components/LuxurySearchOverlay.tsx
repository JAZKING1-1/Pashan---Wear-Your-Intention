import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import {
  exploreProducts,
  searchCatalogue,
  searchRashiCatalogue,
} from "@/lib/search";
import { formatPrice } from "@/lib/cart";
import { CataloguePhoto } from "@/components/CataloguePhoto";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}

export function LuxurySearchOverlay({
  open,
  onOpenChange,
  returnFocusRef,
}: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const results = React.useMemo(() => searchCatalogue(query), [query]);
  const rashiResults = React.useMemo(
    () => searchRashiCatalogue(query),
    [query],
  );
  const shown = query.trim()
    ? results.map(({ product }) => product)
    : exploreProducts;

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);
  const productPath = (slug: string) => {
    onOpenChange(false);
    void navigate({ to: "/products/$slug", params: { slug } });
  };
  const viewAll = () => {
    onOpenChange(false);
    void navigate({ to: "/search", search: { q: query.trim() } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-50 bg-[rgba(50,23,15,.62)] backdrop-blur-md" />
      <DialogContent
        aria-describedby="pashan-search-help"
        onCloseAutoFocus={(event) => {
          // The header opener sits outside this controlled Dialog root. Give
          // Radix an explicit return target, including Safari click-to-open.
          event.preventDefault();
          const opener = returnFocusRef.current?.isConnected
            ? returnFocusRef.current
            : document.getElementById("pashan-search-trigger");
          if (opener instanceof HTMLElement && !opener.closest("[inert]")) {
            opener.focus({ preventScroll: true });
          }
        }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-hidden rounded-t-[20px] border border-[#C96B38]/25 bg-[#FFF9F0] p-0 shadow-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(760px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px]"
      >
        <CommandPrimitive
          shouldFilter={false}
          className="flex h-full w-full flex-col overflow-hidden rounded-[inherit]"
        >
          <div className="p-5 pb-3 sm:p-8 sm:pb-4">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-serif text-3xl text-[#32170F]">
                  Search PASHAN
                </DialogTitle>
                <p
                  id="pashan-search-help"
                  className="mt-1 text-sm text-[#6F5C52]"
                >
                  Find a bracelet, stone or intention.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close search"
                className="flex size-11 items-center justify-center rounded-full bg-[#F4DFCF] text-[#32170F]"
              >
                <X aria-hidden size={20} />
              </button>
            </div>
            <div className="relative flex items-center">
              <Search aria-hidden className="absolute left-4 text-[#A3471C]" />
              <CommandPrimitive.Input
                autoFocus
                aria-label="Search bracelets, stones and intentions"
                value={query}
                onValueChange={setQuery}
                placeholder="Try tiger eye, focus or custom…"
                className="h-14 w-full rounded-xl border border-[#C96B38]/25 bg-white pl-12 pr-4 text-base text-[#32170F] outline-none focus:border-[#A3471C]"
              />
            </div>
          </div>
          <CommandPrimitive.List className="max-h-[60dvh] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
            <CommandPrimitive.Empty className="py-10 text-center">
              <p className="font-heading text-xl text-[#32170F]">
                No matching stone found.
              </p>
              <p className="mt-2 text-sm text-[#6F5C52]">
                Try another word or return to the full collection.
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-5 min-h-11 rounded-full border border-[#C96B38] px-5 text-sm text-[#A3471C]"
              >
                Clear search
              </button>
            </CommandPrimitive.Empty>
            <CommandPrimitive.Group
              heading={
                query.trim()
                  ? `${shown.length + rashiResults.length} results`
                  : "Explore"
              }
              className="text-xs font-medium uppercase tracking-[.2em] text-[#A3471C]"
            >
              <div className="mt-3 grid gap-2">
                {shown.map((product) => (
                  <CommandPrimitive.Item
                    key={product.slug}
                    value={product.slug}
                    onSelect={() => productPath(product.slug)}
                    className="flex min-h-16 cursor-pointer items-center gap-4 rounded-xl border border-[#C96B38]/20 p-2 text-[#32170F] data-[selected=true]:bg-[#F4DFCF]"
                  >
                    <span
                      className="size-12 shrink-0 overflow-hidden rounded-lg"
                      aria-hidden="true"
                    >
                      <CataloguePhoto slug={product.slug} sizes="48px" />
                    </span>
                    <span className="min-w-0 flex-1 normal-case tracking-normal">
                      <strong className="block font-heading text-base font-medium">
                        {product.title}
                      </strong>
                      <small className="text-[#6F5C52]">
                        {product.stone} ·{" "}
                        {product.qualities.slice(0, 2).join(" · ")}
                      </small>
                    </span>
                    <span className="text-sm font-semibold normal-case tracking-normal">
                      {formatPrice(product.price)}
                    </span>
                  </CommandPrimitive.Item>
                ))}
              </div>
            </CommandPrimitive.Group>
            {rashiResults.length > 0 && (
              <CommandPrimitive.Group
                heading="Rashi collection · order enquiry"
                className="mt-4 text-sm text-[#6F5C52]"
              >
                {rashiResults.map((product) => (
                  <CommandPrimitive.Item
                    key={product.slug}
                    value={"rashi-" + product.slug}
                    onSelect={() => {
                      onOpenChange(false);
                      void navigate({
                        to: "/rakhi/rashi/$slug",
                        params: { slug: product.slug },
                      });
                    }}
                    className="flex min-h-16 cursor-pointer items-center gap-4 rounded-xl border border-[#C96B38]/20 p-2 text-[#32170F] data-[selected=true]:bg-[#F4DFCF]"
                  >
                    <img
                      src={product.image}
                      alt=""
                      className="size-12 rounded-lg object-contain"
                    />
                    <span className="flex-1 font-heading">
                      {product.title} <span lang="hi">{product.hindi}</span>
                    </span>
                    <span>₹{product.price}</span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}
            {query.trim() && shown.length + rashiResults.length > 0 && (
              <button
                type="button"
                onClick={viewAll}
                className="mt-4 min-h-11 w-full rounded-xl bg-[#EF7B2D] px-5 text-sm font-semibold text-[#32170F]"
              >
                View all results
              </button>
            )}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
