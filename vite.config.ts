import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  server: {
    port: 3010,
  },
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
        headless: "./src/headlessMoneyHash.ts",
      },
      name: "MoneyHash",
      fileName: (ext, entry) => `${entry}.${ext}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {},
    target: "es2015",
  },
  plugins: [dts({ insertTypesEntry: true, rollupTypes: true })],
  define: {
    SDK_VERSION: JSON.stringify(`JS@${process.env.npm_package_version}`),
  },
});
