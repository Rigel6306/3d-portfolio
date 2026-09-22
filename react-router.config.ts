import type { Config } from "@react-router/dev/config";

export default {
  // Keep the app as a client-rendered SPA because the portfolio relies on
  // browser-only animation and canvas logic that should run after hydration.
  ssr: false,
} satisfies Config;
