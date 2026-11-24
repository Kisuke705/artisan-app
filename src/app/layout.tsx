import type { Metadata, Viewport } from "next";
import { EnregistrementServiceWorker } from "@/components/pwa/enregistrement-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Chantier", template: "%s · Chantier" },
  description: "Interventions, devis et factures pour artisans, depuis le téléphone.",
  applicationName: "Chantier",
  appleWebApp: { capable: true, title: "Chantier", statusBarStyle: "default" },
  icons: { apple: "/icons/icone-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#c2410c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // utilise tout l'écran sur les iPhone à encoche
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-BE">
      <body className="min-h-dvh antialiased">
        {children}
        <EnregistrementServiceWorker />
      </body>
    </html>
  );
}
