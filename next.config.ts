import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le mode « cacheComponents » est désactivé volontairement : toutes les
  // pages de l'app sont privées (liées à l'utilisateur connecté), le cache
  // statique n'apporte rien et compliquerait le code.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // logo de l'entreprise envoyé via un formulaire
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
