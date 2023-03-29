import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry:
        process.env.UMD === "HEADLESS"
          ? "./src/headlessMoneyHash.ts"
          : "./src/index.ts",
      name: "MoneyHash",
      fileName: (ext, entry) => `${entry}.${ext}.js`,
      formats: ["umd"],
    },
    emptyOutDir: false,
    rollupOptions: {},
    target: "es2015",
  },
});