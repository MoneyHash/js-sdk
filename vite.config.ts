import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
// import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  server: {
    port: 3000,
    // https: true,
  },
  build: {
    sourcemap: true,
    minify: false,
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
  plugins: [
    dts({ insertTypesEntry: true, rollupTypes: true }),
    // basicSsl()
  ],
  define: {
    SDK_VERSION: JSON.stringify(`js@${process.env.npm_package_version}`),
  },
});
