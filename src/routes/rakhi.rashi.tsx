import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/rakhi/rashi")({
  beforeLoad: ({ location }) => {
    if (location.pathname.replace(/\/$/, "") === "/rakhi/rashi")
      throw redirect({ to: "/rashi", replace: true });
  },
  component: Outlet,
});
