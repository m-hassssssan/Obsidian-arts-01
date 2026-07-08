import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import hono from "@hono/vite-dev-server"
import { defineConfig } from "vite"
// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/OBSIDIAN.ARTS/" : "/",
  plugins: [
    react(),
    hono({
      entry: "api/boot.ts",
      exclude: [/^\/(?!api)/],
    }),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
      "contracts": path.resolve(__dirname, "./contracts"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
