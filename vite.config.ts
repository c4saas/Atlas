import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    // Suppress noisy PostCSS warning from Tailwind's internal parse without `from`.
    {
      name: "suppress-postcss-from-warning",
      apply: "build",
      buildStart() {
        const original = console.warn;
        // @ts-ignore
        console.warn = (...args: any[]) => {
          const first = args?.[0];
          if (typeof first === "string" && first.includes("A PostCSS plugin did not pass the `from` option to `postcss.parse`")) {
            return; // ignore this specific upstream warning
          }
          return original.apply(console, args as any);
        };
      },
    },
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react") || id.includes("react-dom")) return "react";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("recharts")) return "recharts";
          if (id.includes("xlsx")) return "xlsx";
          if (id.includes("tesseract.js")) return "tesseract";
          if (id.includes("pdf-parse") || /[\\\/]pdfjs-dist[\\\/]/.test(id)) return "pdf";
          if (id.includes("framer-motion") || id.includes("lucide-react")) return "ui";
          return "vendor";
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
