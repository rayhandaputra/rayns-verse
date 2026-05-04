import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react-to-print"],
  },
  ssr: {
    noExternal: ["@react-pdf/renderer"],
  },
  // optimizeDeps: {
  //   include: ["react-to-print"], // pastikan di-scan untuk prebundle
  // },
  // ssr: {
  //   noExternal: ["react-to-print"], // paksa bundle, biar resolve ke ESM
  // },
});
