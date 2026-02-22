import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Allow NEXT_PUBLIC_ prefixed env vars to work in Vite
    ...(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.VITE_CLERK_PUBLISHABLE_KEY
      ? { "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) }
      : {}),
  },
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
}));
