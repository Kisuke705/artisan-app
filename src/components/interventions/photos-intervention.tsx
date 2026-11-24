"use client";
/**
 * Étape 3 « Photos » : avant / après.
 *
 * Le trajet d'une photo :
 *  1. l'artisan prend la photo (l'appareil photo s'ouvre directement) ;
 *  2. on la RÉDUIT dans le téléphone (4 Mo → ~250 Ko) ;
 *  3. on l'envoie DIRECTEMENT au stockage Supabase depuis le navigateur
 *     (sans passer par notre serveur : plus rapide) ;
 *  4. on prévient le serveur (ajouterPhoto) qui enregistre la fiche photo.
 * La règle de stockage (migration 4) vérifie que le dossier est bien
 * celui de l'entreprise de l'utilisateur.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ajouterPhoto, supprimerPhoto } from "@/actions/interventions";
import { Alerte } from "@/components/ui/champs";
import { dimensionsReduites } from "@/lib/interventions";
import { creerClientNavigateur } from "@/lib/supabase/navigateur";

type PhotoAffichee = { id: string; moment: "avant" | "apres"; url: string | null };

/** Réduit une image avec un <canvas> et la renvoie en JPEG. */
async function reduirePhoto(fichier: File): Promise<Blob> {
  // « from-image » : respecte l'orientation (photo prise en portrait)
  const image = await createImageBitmap(fichier, { imageOrientation: "from-image" });
  const { largeur, hauteur } = dimensionsReduites(image.width, image.height);
  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  canvas.getContext("2d")!.drawImage(image, 0, 0, largeur, hauteur);
  image.close();
  return new Promise((resoudre, rejeter) =>
    canvas.toBlob((blob) => (blob ? resoudre(blob) : rejeter(new Error("Conversion impossible"))), "image/jpeg", 0.8),
  );
}

export function PhotosIntervention({ interventionId, entrepriseId, photos, lectureSeule = false }: {
  interventionId: string;
  entrepriseId: string;
  photos: PhotoAffichee[];
  lectureSeule?: boolean;
}) {
  const router = useRouter();
  const [envoisEnCours, setEnvoisEnCours] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [, demarrerTransition] = useTransition();

  async function envoyer(fichiers: FileList | null, moment: "avant" | "apres") {
    if (!fichiers?.length) return;
    setErreur(null);
    const supabase = creerClientNavigateur();

    for (const fichier of Array.from(fichiers)) {
      setEnvoisEnCours((n) => n + 1);
      try {
        let contenu: Blob;
        try {
          contenu = await reduirePhoto(fichier);
        } catch {
          contenu = fichier; // format que le navigateur ne sait pas réduire : on envoie tel quel
        }
        const extension = contenu.type === "image/jpeg" ? "jpg" : (fichier.name.split(".").pop() ?? "jpg");
        const chemin = `${entrepriseId}/${interventionId}/${moment}-${crypto.randomUUID()}.${extension}`;

        const { error } = await supabase.storage
          .from("photos")
          .upload(chemin, contenu, { contentType: contenu.type || "image/jpeg" });
        if (error) throw error;

        const resultat = await ajouterPhoto(interventionId, moment, chemin);
        if (!resultat.ok) throw new Error(resultat.message);
      } catch (e) {
        console.error("Envoi photo :", e);
        setErreur("Une photo n'a pas pu être envoyée. Vérifiez la connexion et réessayez.");
      } finally {
        setEnvoisEnCours((n) => n - 1);
      }
    }
    demarrerTransition(() => router.refresh()); // recharge la page pour afficher les nouvelles photos
  }

  // Une fonction qui renvoie du JSX (et pas un composant) : rien n'est recréé à chaque affichage
  function groupe(moment: "avant" | "apres", titre: string) {
    const liste = photos.filter((p) => p.moment === moment);
    return (
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">{titre}</h2>
        {liste.length > 0 && (
          <ul className="grid grid-cols-3 gap-2">
            {liste.map((photo) => (
              <li key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-fond">
                {photo.url && (
                  <a href={photo.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- lien temporaire signé */}
                    <img src={photo.url} alt={`Photo ${titre.toLowerCase()}`} className="size-full object-cover" />
                  </a>
                )}
                {!lectureSeule && (
                  <button
                    type="button"
                    aria-label="Supprimer la photo"
                    onClick={() => {
                      if (window.confirm("Supprimer cette photo ?")) {
                        demarrerTransition(async () => {
                          await supprimerPhoto(interventionId, photo.id);
                          router.refresh();
                        });
                      }
                    }}
                    className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-black/60 text-lg text-white"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {liste.length === 0 && lectureSeule && <p className="text-sm text-gris">Aucune photo.</p>}
        {!lectureSeule && (
          // Un <label> autour de l'<input> caché : tout le bouton ouvre l'appareil photo
          <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-marque/50 bg-marque-clair font-semibold text-marque">
            📷 Ajouter une photo {moment === "avant" ? "avant" : "après"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(e) => {
                void envoyer(e.target.files, moment);
                e.target.value = ""; // permet de reprendre la même photo
              }}
            />
          </label>
        )}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {erreur && <Alerte type="erreur">{erreur}</Alerte>}
      {envoisEnCours > 0 && (
        <p role="status" className="rounded-xl bg-marque-clair p-3 text-center font-medium text-marque">
          Envoi de {envoisEnCours} photo{envoisEnCours > 1 ? "s" : ""}…
        </p>
      )}
      {groupe("avant", "Avant")}
      {groupe("apres", "Après")}
    </div>
  );
}
