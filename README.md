# Chantier — SaaS pour artisans (MVP)

Application web mobile (PWA) pour artisans indépendants en Belgique : enregistrer
une intervention chez le client, lui montrer le montant, puis générer un devis ou
une facture conforme.

**Stack :** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase
(auth, Postgres, stockage, RLS) · Vitest.

---

## Avancement

| Étape | Fonctionnalité | État |
|---|---|---|
| 0 | Schéma de base de données complet + tests | ✅ |
| 1 | Inscription, connexion, fiche entreprise au premier lancement | ✅ |
| 2 | Clients et adresses, recherche rapide | ✅ |
| 3 | Création d'intervention (photos, lignes, catalogue) | ✅ |
| 4 | Récapitulatif client + signature au doigt | à venir |
| 5 | Devis / facture en un clic, PDF, email | à venir |
| 6 | Historique par client et par adresse | à venir |
| 7 | Tableau de bord | à venir |

---

## Installation locale

### Prérequis

- **Node.js 22** ou plus récent
- **Docker Desktop** (Supabase local tourne dans des conteneurs Docker)
- La CLI Supabase s'utilise via `npx supabase …` : rien à installer

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer Supabase en local

```bash
npx supabase start
```

La première fois, le téléchargement des images Docker prend quelques minutes.
À la fin, la commande affiche les adresses utiles, dont :

- **API URL** : `http://127.0.0.1:54321`
- **Publishable key** (ou *anon key*) : la clé publique
- **Studio** : `http://127.0.0.1:54323` (interface pour voir les tables)
- **Mailpit** : `http://127.0.0.1:54324` (les emails envoyés en local arrivent ici)

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Puis collez la **Publishable key** dans `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### 4. Créer les tables et les données de démonstration

```bash
npx supabase db reset
```

Cette commande applique les migrations de `supabase/migrations/` puis charge
`supabase/seed.sql`.

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrez <http://localhost:3000>.

**Compte de démonstration :** `demo@chantier.be` / `demo1234`.
Vous pouvez aussi créer un nouveau compte : en local, la confirmation par email
est désactivée et vous arrivez directement sur la fiche entreprise.

> **Tester sur votre téléphone :** téléphone et ordinateur sur le même Wi-Fi,
> lancez `npm run dev -- -H 0.0.0.0` et ouvrez `http://<IP-de-l-ordinateur>:3000`.
> Pour installer la PWA il faut du HTTPS : faites ce test sur la version
> déployée sur Vercel.

---

## Tests

```bash
npm test          # calculs, TVA, numérotation, validations (Vitest)
npm run test:db   # règles de la base : RLS, numérotation sans trou, TVA…
```

`npm run test:db` crée un Postgres temporaire et y applique les migrations. Il
faut que Postgres soit installé sur la machine (`initdb`, `pg_ctl`, `psql`), mais
pas Docker. Sur macOS : `brew install postgresql@16`.

Les deux suites testent les **mêmes exemples** : le calcul fait dans le
navigateur (TypeScript) et celui fait par la base (SQL) doivent donner
exactement les mêmes montants.

---

## Organisation du code

```
supabase/
  migrations/        Le schéma de la base, dans l'ordre :
    …01_schema.sql                 tables
    …02_securite_rls.sql           sécurité (chaque entreprise ne voit que ses données)
    …03_documents_numerotation.sql totaux, protection et numérotation des factures
    …04_stockage.sql               photos, signatures, logos
    …05_recherche_clients.sql      recherche rapide (accents, téléphones, adresses)
    …06_interventions.sql          lignes d'intervention, verrouillage après facturation
  seed.sql           Données de démonstration
src/
  proxy.ts           Exécuté avant chaque page : session et redirections
  app/               Les pages (une URL = un dossier)
    (auth)/          Connexion, inscription, mot de passe oublié
    (app)/           Pages privées, avec la barre de navigation
    bienvenue/       Fiche entreprise au premier lancement
  actions/           Server Actions (traitement des formulaires côté serveur)
  components/        Composants d'interface
  lib/
    facturation/     Calculs, TVA, numérotation : fonctions pures et testées
    belgique/        BCE, TVA, IBAN
    supabase/        Connexion à Supabase (navigateur / serveur)
    peppol/          Facture électronique B2B : interface seulement (voir son README)
tests/db/            Tests SQL
```

### Règles importantes

- **La base a toujours le dernier mot.** Les règles TVA et la numérotation sont
  vérifiées dans le navigateur (pour prévenir l'artisan) *et* dans Postgres
  (`emettre_document()`), qui ne peut pas être contourné.
- **Une facture émise ne change plus.** Pour la corriger, on émet une note de
  crédit. Un trigger Postgres refuse toute modification ou suppression.
- **Numérotation sans trou.** Le numéro est attribué à l'émission, dans une
  transaction verrouillée. Un brouillon n'a pas de numéro.

---

## Déploiement

### 1. Supabase (base de données en ligne)

1. Créez un projet sur <https://supabase.com/dashboard>. Choisissez la région
   **Frankfurt** ou **Paris** : vos données restent dans l'Union européenne (RGPD).
2. Reliez votre dossier au projet et envoyez les migrations :

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref <id-du-projet>
   ```

   ```bash
   npx supabase db push
   ```

   N'envoyez **pas** `seed.sql` en production : il crée un compte de démo.
3. Dans **Authentication → URL Configuration** :
   - *Site URL* : `https://votre-app.vercel.app`
   - *Redirect URLs* : `https://votre-app.vercel.app/auth/callback`
4. Dans **Authentication → Emails → SMTP Settings**, configurez un vrai serveur
   d'envoi (par exemple Resend). Le service d'email intégré à Supabase est
   limité à quelques messages par heure et n'est pas fait pour la production.
5. Dans **Project Settings → API Keys**, copiez l'URL du projet et la
   **publishable key**.

### 2. Vercel (l'application)

1. Poussez le code sur GitHub, puis sur <https://vercel.com/new> importez le dépôt.
2. Ajoutez les variables d'environnement :

   | Nom | Valeur |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key |
   | `NEXT_PUBLIC_SITE_URL` | `https://votre-app.vercel.app` |

3. Cliquez sur **Deploy**. Chaque `git push` redéploiera automatiquement.
4. Si vous changez plus tard de domaine, mettez à jour `NEXT_PUBLIC_SITE_URL`
   *et* les URL dans Supabase.

### Installer l'app sur le téléphone

Ouvrez l'adresse Vercel dans le navigateur du téléphone :

- **Android (Chrome)** : menu ⋮ → *Installer l'application*
- **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*

---

## À faire valider par un comptable

Les textes des mentions TVA sont regroupés dans
`src/lib/facturation/regles-tva.ts` (constante `MENTIONS`), pour être faciles à
relire et corriger :

- la mention d'autoliquidation (travaux immobiliers, client assujetti) ;
- la mention du régime de franchise des petites entreprises ;
- la mention et les conditions de la TVA à 6 % (logement de plus de 10 ans).
