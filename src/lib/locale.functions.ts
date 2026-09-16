import { createServerFn } from "@tanstack/react-start";
export const readLocaleCookie = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getCookie } = await import("@tanstack/react-start/server");
    return getCookie("pashan-locale") ?? "en";
  },
);
