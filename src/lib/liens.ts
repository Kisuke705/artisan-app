/**
 * Liens utiles d'un toucher : itinéraire GPS, email.
 */

type AdressePostale = { rue: string; code_postal: string; ville: string };

/** Ouvre l'adresse dans Google Maps (ou l'app de cartes du téléphone). */
export function lienItineraire(adresse: AdressePostale): string {
  const destination = `${adresse.rue}, ${adresse.code_postal} ${adresse.ville}, Belgique`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function formaterAdresse(adresse: AdressePostale): string {
  return `${adresse.rue}, ${adresse.code_postal} ${adresse.ville}`;
}
