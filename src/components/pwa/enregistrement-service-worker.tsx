"use client";
/**
 * Enregistre le service worker (public/sw.js) au chargement de l'app.
 * En développement on ne l'active pas, pour ne pas garder de vieilles
 * pages en cache pendant qu'on code.
 */
import { useEffect } from "react";

export function EnregistrementServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((erreur) => {
        console.error("Service worker non enregistré :", erreur);
      });
    }
  }, []);
  return null;
}
