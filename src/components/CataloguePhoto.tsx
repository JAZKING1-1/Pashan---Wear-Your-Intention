import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  cataloguePhotos,
  originalPhotoDimensions,
  originalPhotoSrcSet,
  photoFraming,
} from "@/data/product-photography";
import "@/styles-photography.css";

/** Presentation-only framing of the original photo. No bead or background edits. */
export function CataloguePhoto({
  slug,
  sizes = "(max-width:350px) 90vw, (max-width:699px) 44vw, (max-width:1099px) 44vw, 280px",
  priority = false,
  className = "",
}: {
  slug: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const photos = cataloguePhotos(slug);
  const [failed, setFailed] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const index = failed && photos.images[1] ? 1 : 0;
  const src = photos.images[index];
  const frame = photoFraming(src);
  useEffect(() => setFailed(0), [slug]);
  useEffect(() => {
    const img = imageRef.current;
    if (img?.complete && img.currentSrc && !img.naturalWidth)
      setFailed((value) => Math.min(2, value + 1));
  }, [src]);
  return (
    <span
      className={`catalogue-photo ${className}`}
      data-photo-slug={slug}
      style={
        {
          "--photo-width": `${frame.width}%`,
          "--photo-x": `${frame.x}%`,
          "--photo-y": `${frame.y}%`,
        } as CSSProperties
      }
    >
      {failed < 2 ? (
        <img
          ref={imageRef}
          src={src}
          srcSet={failed ? undefined : originalPhotoSrcSet(src)}
          sizes={sizes}
          alt={photos.imageAlts[index]}
          {...originalPhotoDimensions(src)}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          data-fallback={failed ? "true" : undefined}
          onError={() => setFailed((value) => Math.min(2, value + 1))}
        />
      ) : (
        <span className="catalogue-photo-unavailable">
          Photograph unavailable. Open the product details to explore this
          piece.
        </span>
      )}
    </span>
  );
}
