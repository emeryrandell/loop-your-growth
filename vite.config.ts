// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// 👉 Replace this with your current Replit URL if it changes
const PUBLIC_HOST =
  process.env.PUBLIC_HOST ||
  "5bf22256-a2b2-4f77-8a4e-2b86b168b286-00-grgnq6re9vqn.riker.replit.dev";

export default defineConfig(({ mode }) => ({
  server: {
    host: true,                                // listen on 0.0.0.0 / ::
    port: Number(process.env.PORT) || 8080,    // Replit sets PORT
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      PUBLIC_HOST,
      // the two below are handy if you spin up another Repl
      ".repl.co",
      ".replit.dev",
    ],
    // HMR over WSS so live reload works through Replit's proxy
    hmr: {
      host: PUBLIC_HOST,
      protocol: "wss",
      clientPort: 443,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
