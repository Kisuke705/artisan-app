/**
 * Catalogue des prestations réutilisables.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { basculerPrestation } from "@/actions/catalogue";
import { LienBouton } from "@/components/ui/bouton";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { exigerEntreprise } from "@/lib/auth";
import { formaterEuros } from "@/lib/format";
import { DOMAINES, LISTE_DOMAINES } from "@/lib/interventions";
import type { Prestation } from "@/types/modeles";

export const metadata: Metadata = { title: "Catalogue" };

export default async function PageCatalogue() {
  const { supabase } = await exigerEntreprise();
  const { data } = await supabase.from("prestation_catalogue").select("*").order("description");
  const prestations = (data ?? []) as Prestation[];

  // Groupes : « Tous domaines » d'abord, puis chaque domaine
  const groupes = [
    { titre: "Tous domaines", liste: prestations.filter((p) => p.domaine === null) },
    ...LISTE_DOMAINES.map((d) => ({
      titre: `${DOMAINES[d].emoji} ${DOMAINES[d].libelle}`,
      liste: prestations.filter((p) => p.domaine === d),
    })),
  ].filter((g) => g.liste.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <EnTetePage
        titre="Catalogue"
        retour={{ href: "/entreprise", libelle: "Entreprise" }}
        action={<LienBouton href="/catalogue/nouvelle">+ Ajouter</LienBouton>}
      />
      {prestations.length === 0 && (
        <p className="rounded-2xl bg-white p-5 text-center text-gris shadow-sm">
          Ajoutez vos prestations habituelles (déplacement, main d&apos;œuvre, pièces…) pour les retrouver d&apos;un toucher.
        </p>
      )}
      {groupes.map((groupe) => (
        <section key={groupe.titre} className="flex flex-col gap-2">
          <h2 className="font-bold">{groupe.titre}</h2>
          <ul className="divide-y divide-bord overflow-hidden rounded-2xl bg-white shadow-sm">
            {groupe.liste.map((p) => (
              <li key={p.id} className={`flex items-center gap-2 pr-2 ${p.actif ? "" : "opacity-50"}`}>
                <Link href={`/catalogue/${p.id}`} className="min-h-14 min-w-0 flex-1 px-4 py-2">
                  <span className="block font-medium">{p.description}</span>
                  <span className="block text-sm text-gris">
                    {formaterEuros(Number(p.prix_unitaire_htva))} HTVA / {p.unite}
                    {!p.actif && " · désactivée"}
                  </span>
                </Link>
                <form action={basculerPrestation.bind(null, p.id, !p.actif)}>
                  <button type="submit" className="min-h-11 rounded-lg px-3 text-sm font-medium text-marque">
                    {p.actif ? "Désactiver" : "Réactiver"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
