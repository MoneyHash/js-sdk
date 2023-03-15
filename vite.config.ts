import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "MoneyHash",
      fileName: ext => `index.${ext}.js`,
    },
    rollupOptions: {},
    // target: "es2015",
  },
  plugins: [dts({ insertTypesEntry: true, rollupTypes: true })],
});
