import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3010",
    env: {
      SANDBOX_API_KEY: "EAmTI7Ne.gHiWZPR23gwPo3UIeYQZ7EirALzfZzEc",
      BACKEND_URL: "https://stg-dashboard.moneyhash.io/api/v1.1",
      EMBED_URL: "https://stg-embed.moneyhash.io",
    },
    defaultCommandTimeout: 10000,
  },
});
