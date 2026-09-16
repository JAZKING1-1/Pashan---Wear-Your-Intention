import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { findRashi } from "@/data/rashi-catalogue";
export const Route = createFileRoute("/rakhi/product/$slug")({
  validateSearch: (search: Record<string, unknown>): { action?: string } => ({
    action: typeof search.action === "string" ? search.action : undefined,
  }),
  beforeLoad: ({ params }) => {
    if (!findRashi(params.slug)) throw notFound();
    throw redirect({ to: "/rakhi/rashi/$slug", params, replace: true });
  },
});
