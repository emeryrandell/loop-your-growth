// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Replit gives you a public URL like:
// 5bf22256-a2b2-4f77-8a4e-2b86b168b286-00-grgnq6re9vqn.riker.replit.dev
// Paste that exact host here (or set env PUBLIC_HOST in Replit Secrets)
const PUBLIC_HOST =
  process.env.PUBLIC_HOST ||
  "5bf22256-a2b2-4f77-8a4e-2b86b168b286-00-grgnq6re9vqn.riker.replit.dev";

// If your Repl URL changes, update PUBLIC_HOST or set it in Secrets.
export default defineConfig(({ mode }) => ({
  server: {
    host: true,                                // 0.0.0.0 / ::
    port: Number(process.env.PORT) || 8080,
    // ✅ The important bit
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      PUBLIC_HOST,
      // wildcard-ish allowances for Replit subdomains
      "repl.co",
      "replit.dev",
    ],
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
