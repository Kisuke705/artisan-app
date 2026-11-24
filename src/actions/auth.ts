"use server";
/**
 * Server Actions d'authentification.
 * « use server » : ces fonctions s'exécutent sur le serveur, mais un
 * formulaire peut les appeler directement (Next.js s'occupe de l'envoi).
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { creerClientServeur } from "@/lib/supabase/serveur";
import {
  erreursParChamp,
  lireFormulaire,
  type EtatFormulaire,
} from "@/lib/validation/formulaire";

/** Traduit les erreurs Supabase (en anglais) pour l'artisan. */
function traduireErreur(code: string | undefined, message: string): string {
  switch (code) {
    case "invalid_credentials":
      return "Email ou mot de passe incorrect.";
    case "user_already_exists":
    case "email_exists":
      return "Un compte existe déjà avec cet email. Connectez-vous.";
    case "email_not_confirmed":
      return "Confirmez d'abord votre adresse email (cliquez sur le lien reçu).";
    case "weak_password":
      return "Mot de passe trop faible : au moins 8 caractères, avec lettres et chiffres.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Trop de tentatives. Réessayez dans quelques minutes.";
    case "same_password":
      return "Le nouveau mot de passe doit être différent de l'ancien.";
    default:
      console.error("Erreur Supabase Auth :", code, message);
      return "Une erreur est survenue. Réessayez.";
  }
}

/** Adresse du site, pour les liens envoyés par email. */
async function adresseDuSite(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

const email = z.email("Adresse email invalide.").trim().toLowerCase();
const motDePasse = z.string().min(8, "Au moins 8 caractères.");

// ---------------------------------------------------------------------------

export async function seConnecter(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = z
    .object({ email, mot_de_passe: z.string().min(1, "Indiquez votre mot de passe.") })
    .safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.signInWithPassword({
    email: verif.data.email,
    password: verif.data.mot_de_passe,
  });
  if (error) return { message: traduireErreur(error.code, error.message), valeurs };

  redirect("/");
}

export async function sInscrire(_etat: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = z
    .object({ email, mot_de_passe: motDePasse, confirmation: z.string() })
    .refine((d) => d.mot_de_passe === d.confirmation, {
      path: ["confirmation"],
      message: "Les deux mots de passe ne sont pas identiques.",
    })
    .safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.signUp({
    email: verif.data.email,
    password: verif.data.mot_de_passe,
    options: { emailRedirectTo: `${await adresseDuSite()}/auth/callback?suite=/bienvenue` },
  });
  if (error) return { message: traduireErreur(error.code, error.message), valeurs };

  // Si la confirmation par email est désactivée (cas du Supabase local),
  // l'utilisateur est directement connecté.
  if (data.session) redirect("/bienvenue");

  return {
    succes: true,
    message: `Un email de confirmation a été envoyé à ${verif.data.email}. Cliquez sur le lien qu'il contient pour activer votre compte.`,
  };
}

export async function seDeconnecter() {
  const supabase = await creerClientServeur();
  await supabase.auth.signOut();
  redirect("/connexion");
}

export async function demanderReinitialisation(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = z.object({ email }).safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error), valeurs };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.resetPasswordForEmail(verif.data.email, {
    redirectTo: `${await adresseDuSite()}/auth/callback?suite=/nouveau-mot-de-passe`,
  });
  if (error && error.code?.startsWith("over_")) {
    return { message: traduireErreur(error.code, error.message), valeurs };
  }
  // Même message que le compte existe ou non : on ne révèle pas qui est inscrit.
  return {
    succes: true,
    message: "Si un compte existe avec cet email, vous allez recevoir un lien pour choisir un nouveau mot de passe.",
  };
}

export async function changerMotDePasse(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const valeurs = lireFormulaire(formData);
  const verif = z
    .object({ mot_de_passe: motDePasse, confirmation: z.string() })
    .refine((d) => d.mot_de_passe === d.confirmation, {
      path: ["confirmation"],
      message: "Les deux mots de passe ne sont pas identiques.",
    })
    .safeParse(valeurs);
  if (!verif.success) return { erreurs: erreursParChamp(verif.error) };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.updateUser({ password: verif.data.mot_de_passe });
  if (error) return { message: traduireErreur(error.code, error.message) };

  redirect("/");
}
