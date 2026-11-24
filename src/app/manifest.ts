/**
 * Manifeste PWA : c'est ce fichier qui rend l'application « installable »
 * sur l'écran d'accueil du téléphone, comme une vraie app.
 * Next.js le sert automatiquement à l'adresse /manifest.webmanifest.
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chantier – interventions et factures",
    short_name: "Chantier",
    description: "Interventions, devis et factures pour artisans, depuis le téléphone.",
    lang: "fr-BE",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f5f4",
    theme_color: "#c2410c",
    icons: [
      { src: "/icons/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icone-512-masquable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
