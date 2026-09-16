import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { RashiExperience } from "@/components/rakhi/RashiExperience";
import { findRashi } from "@/data/rashi-catalogue";
export const Route = createFileRoute("/rashi")({
  validateSearch: (search: Record<string, unknown>): { sign?: string } => ({
    sign:
      typeof search.sign === "string" && findRashi(search.sign)
        ? search.sign
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Rashi Collection · Introductory ₹899 — PASHAN" },
      {
        name: "description",
        content:
          "All 12 zodiac cord Rakhis, with real product photographs. Introductory ₹899 per piece; availability confirmed on enquiry.",
      },
    ],
  }),
  component: RashiPage,
});
function RashiPage() {
  const { sign } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SiteLayout>
      <RashiExperience
        sign={sign}
        onSignChange={(next) => {
          void navigate({ search: { sign: next }, resetScroll: false });
        }}
      />
    </SiteLayout>
  );
}
