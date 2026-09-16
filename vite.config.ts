import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { execFileSync } from "node:child_process";
// Render documents RENDER_GIT_COMMIT as the SHA of the build/deploy.
function releaseId() {
  if (/^[a-f0-9]{40}$/i.test(process.env.RENDER_GIT_COMMIT ?? ""))
    return process.env.RENDER_GIT_COMMIT!;
  try {
    const git = (...args: string[]) =>
      execFileSync(
        "git",
        [
          "-c",
          `safe.directory=${process.cwd().replaceAll("\\", "/")}`,
          ...args,
        ],
        { encoding: "utf8" },
      ).trim();
    return (
      git("rev-parse", "HEAD") + (git("status", "--porcelain") ? "-local" : "")
    );
  } catch {
    return "local-unversioned";
  }
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },

  nitro: {
    preset: process.env.NITRO_PRESET || "node-server",
  },

  vite: {
    define: { __PASHAN_RELEASE__: JSON.stringify(releaseId()) },
    preview: {
      allowedHosts: true,
    },
  },
});
