import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react()],
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
    build: {
      outDir: env.VITE_OUT_DIR || "dist",
      emptyOutDir: true,
      minify: false,
      lib: {
        entry: "src/main.tsx",
        name: "App",
        fileName: (format) => `reajctJs-${format}.js`,
        formats: ["iife"],
      },
      rollupOptions: {
        output: {
          format: "iife",
          name: "App",
        },
        treeshake: false,
      },
      terserOptions: {
        compress: false,
        mangle: false,
      },
    },
  };
});
