import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { BraceletFinder } from "@/components/BraceletFinder";

export const Route = createFileRoute("/find-your-bracelet")({
  component: FindPage,
  head: () => ({
    meta: [
      { title: "Find your bracelet · PASHAN" },
      {
        name: "description",
        content:
          "Four considered choices. Discover PASHAN bracelets by your intention, favourite colours, wearing style and budget.",
      },
    ],
  }),
});

function FindPage() {
  return (
    <SiteLayout>
      <BraceletFinder />
    </SiteLayout>
  );
}
