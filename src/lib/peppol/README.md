# Module Peppol (facture électronique B2B)

**État : non implémenté (MVP).** Seule l'interface existe (`types.ts`).

## Pourquoi ?

En Belgique, depuis le 1er janvier 2026, une entreprise assujettie qui facture
une autre entreprise assujettie doit lui envoyer une **facture électronique
structurée** via le réseau **Peppol**. Un PDF envoyé par email ne suffit plus
dans ce cas. Les factures aux particuliers ne sont pas concernées.

## Ce qu'il faudra faire pour l'activer

1. Choisir un **Access Point** Peppol certifié (prestataire qui fournit une API).
2. Écrire `access-point.ts` qui implémente `ServicePeppol` avec son API.
3. Écrire `ubl.ts` : conversion d'un document émis (table `document`,
   `document_ligne`, `entreprise_snapshot`, `client_snapshot`) en XML
   **UBL Peppol BIS Billing 3.0**. Correspondances utiles :
   - TVA 21 % / 6 % → catégorie `S` ; autoliquidation → catégorie `AE` ;
     franchise → catégorie `E` avec motif d'exonération.
   - Communication structurée → `PaymentID`.
4. Dans `index.ts`, remplacer `peppolDesactive` par la vraie implémentation
   quand la configuration (clé API) est présente.
5. Ajouter en base une table `envoi_peppol` (document_id, id_envoi, statut).

Le reste de l'application n'aura pas à changer : il appelle déjà
`peppol.estDisponible()` avant de proposer l'envoi Peppol.
