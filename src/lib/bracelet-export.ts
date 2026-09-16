import type { BraceletDesign } from "@/lib/bracelet-design";
import { braceletSvg } from "@/lib/bracelet-scene/illustration";
import { customStoneOptions } from "@/data/products";
import { atelierText } from "@/data/atelier-copy";
import type { Locale } from "@/lib/i18n";
import logoUrl from "@/assets/pashan-logo-transparent.png";
const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image unavailable"));
    img.src = url;
  });
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export async function exportDesignCard(
  design: BraceletDesign,
  locale: Locale,
): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const svgUrl = URL.createObjectURL(
    new Blob([braceletSvg(design.beads)], { type: "image/svg+xml" }),
  );
  try {
    const [bracelet, logo] = await Promise.all([
      loadImage(svgUrl),
      loadImage(logoUrl),
    ]);
    ctx.fillStyle = "#FFF9F0";
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.strokeStyle = "#B48D52";
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, 1008, 1278);
    const width = 260;
    const height = (width * logo.naturalHeight) / logo.naturalWidth;
    ctx.drawImage(logo, 410, 55, width, Math.min(height, 110));
    ctx.fillStyle = "#32170F";
    ctx.textAlign = "center";
    ctx.direction = locale === "ar" ? "rtl" : "ltr";
    ctx.font = "42px Inter, sans-serif";
    ctx.fillText(atelierText(locale, "title"), 540, 220);
    ctx.drawImage(bracelet, 100, 265, 880, 880);
    ctx.font = "26px Inter, sans-serif";
    ctx.fillStyle = "#6F5C52";
    const counts = new Map<string, number>();
    design.beads.forEach((b) =>
      counts.set(b.stoneKey, (counts.get(b.stoneKey) ?? 0) + 1),
    );
    const words = [...counts]
      .map(
        ([key, count]) =>
          `${count} ${customStoneOptions.find((s) => s.key === key)?.label}`,
      )
      .join(" · ")
      .split(" ");
    let line = "",
      y = 1157;
    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (ctx.measureText(candidate).width > 900) {
        ctx.fillText(line, 540, y);
        y += 36;
        line = word;
      } else line = candidate;
    }
    if (line) ctx.fillText(line, 540, y);
    ctx.font = "20px Inter, sans-serif";
    ctx.fillText("pashan-wear-your-intention.onrender.com", 540, 1280);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
