/**
 * Service worker : un petit programme que le navigateur garde en arrière-plan.
 *
 * Stratégie volontairement simple pour le MVP :
 *  - les pages viennent TOUJOURS du réseau (données à jour, sécurité) ;
 *  - si le réseau est coupé (cave, chantier isolé), on affiche une page
 *    « hors ligne » plutôt que l'erreur du navigateur.
 */
const CACHE = "chantier-v1";
const PAGE_HORS_LIGNE = "/hors-ligne.html";

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(caches.open(CACHE).then((cache) => cache.add(PAGE_HORS_LIGNE)));
  self.skipWaiting();
});

self.addEventListener("activate", (evenement) => {
  // Supprime les anciens caches quand on change de version
  evenement.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evenement) => {
  if (evenement.request.mode !== "navigate") return; // seulement les changements de page
  evenement.respondWith(
    fetch(evenement.request).catch(() => caches.match(PAGE_HORS_LIGNE)),
  );
});
