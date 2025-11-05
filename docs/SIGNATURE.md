# Signature Électronique sur Devis

## Vue d'ensemble

La fonctionnalité de signature électronique permet aux clients de signer les devis directement dans l'application. Les signatures sont stockées de manière sécurisée dans Supabase Storage et affichées sur les PDF des devis.

## Architecture

### Composants

#### 1. SignatureCanvas (`src/components/signatures/SignatureCanvas.tsx`)

Composant React pour dessiner ou uploader une signature :
- **Canvas HTML5** pour dessiner la signature à la souris ou au doigt (tactile)
- **Upload d'image** pour importer une signature scannée ou photographiée
- **Validation** des champs requis (nom et email du signataire)
- **Exportation** de la signature au format PNG

**Props :**
- `onSave: (signatureBlob: Blob, signerName: string, signerEmail: string) => Promise<void>`
- `onCancel: () => void`
- `isSaving?: boolean`

#### 2. SignatureDisplay (`src/components/signatures/SignatureDisplay.tsx`)

Composant pour afficher une signature déjà enregistrée :
- Affiche l'image de la signature
- Affiche les informations du signataire (nom, email)
- Affiche la date et l'heure de signature

**Props :**
- `signatureUrl: string` - URL publique de la signature
- `signedAt: string` - Date de signature (ISO 8601)
- `signedByName?: string` - Nom du signataire
- `signedByEmail?: string` - Email du signataire

### Services

#### signature.service.ts (`src/services/signature.service.ts`)

Service pour gérer les opérations sur les signatures :

**Fonctions :**

1. `uploadSignature(quoteId: string, signatureBlob: Blob): Promise<SignatureUploadResult>`
   - Upload une signature vers Supabase Storage
   - Retourne l'URL publique de la signature

2. `updateQuoteWithSignature(quoteId: string, signatureUrl: string, signerName: string, signerEmail: string): Promise<void>`
   - Met à jour le devis avec les informations de signature
   - Change automatiquement le statut à "signed"

3. `deleteSignature(signaturePath: string): Promise<void>`
   - Supprime une signature de Supabase Storage

### Base de données

#### Migration : `20251105_add_quote_signatures.sql`

Ajouts à la table `quotes` :
```sql
signature_url TEXT          -- URL publique de l'image de signature
signed_at TIMESTAMPTZ       -- Date et heure de signature
signed_by_name TEXT         -- Nom du signataire
signed_by_email TEXT        -- Email du signataire
```

Nouveau statut : `'signed'` ajouté aux statuts possibles

#### Supabase Storage

**Bucket créé :** `signatures`
- **Accès public** : Oui (pour affichage dans les PDF)
- **Organisation** : `{quoteId}/quote-{quoteId}-{timestamp}.png`

**Policies RLS :**
- `authenticated` peut **INSERT** (upload)
- `public` peut **SELECT** (lecture)
- `authenticated` peut **DELETE**

## Utilisation

### Intégration dans QuoteDetail

Le composant `QuoteDetail` a été modifié pour inclure :

1. **Bouton "Signer le devis"** - Affiché si :
   - Le devis n'est pas déjà signé (`!quote.signature_url`)
   - Le statut n'est pas "refused" ou "expired"

2. **Dialog de signature** - Modal avec le `SignatureCanvas`

3. **Affichage de la signature** - Si le devis est signé, affiche `SignatureDisplay`

4. **Statut "Signé"** - Nouveau badge vert pour le statut "signed"

### Flux de signature

1. L'utilisateur clique sur "Signer le devis"
2. Un dialog s'ouvre avec le canvas de signature
3. L'utilisateur :
   - Dessine sa signature sur le canvas, OU
   - Importe une image de signature
4. L'utilisateur remplit son nom et email
5. Clic sur "Enregistrer la signature"
6. L'application :
   - Convertit le canvas en blob PNG
   - Upload le blob vers Supabase Storage
   - Met à jour le devis avec l'URL et les métadonnées
   - Change le statut à "signed"
7. Le dialog se ferme et la signature s'affiche

## Génération PDF

### Intégration dans QuotePDF

Le composant `QuotePDF` a été modifié pour afficher la signature :

**Section ajoutée :**
- Titre : "✓ Devis signé électroniquement"
- Image de la signature (150x60px)
- Informations : Nom, email, date et heure

**Style :**
- Fond vert clair (`#f0fdf4`)
- Bordure gauche verte
- Positionnée après les conditions du devis

## Sécurité

### Stockage
- Les signatures sont stockées dans un bucket Supabase Storage dédié
- URLs publiques pour permettre l'affichage dans les PDF
- Organisation par dossier de devis pour faciliter la gestion

### Authentification
- Seuls les utilisateurs authentifiés peuvent uploader des signatures
- Row Level Security (RLS) appliquée sur les tables

### Traçabilité
- Chaque signature enregistre :
  - Le nom du signataire
  - L'email du signataire
  - La date et l'heure exacte de signature
- Ces informations sont immuables une fois enregistrées

## Limitations et améliorations futures

### Limitations actuelles
- Pas de vérification d'identité forte (pas de 2FA sur la signature)
- Pas de certificat numérique
- Pas d'horodatage certifié

### Améliorations possibles
1. **Signature électronique qualifiée** via API tierce (DocuSign, HelloSign)
2. **Notification email** automatique après signature
3. **Historique des signatures** (si un devis est re-signé)
4. **Vérification OTP** par email avant signature
5. **Géolocalisation** du lieu de signature
6. **IP tracking** pour la traçabilité

## Tests recommandés

### Tests manuels
- [ ] Dessiner une signature sur desktop
- [ ] Dessiner une signature sur mobile/tablette
- [ ] Uploader une image de signature (JPG, PNG)
- [ ] Vérifier l'affichage de la signature dans le devis
- [ ] Vérifier l'affichage de la signature dans le PDF
- [ ] Vérifier que le statut change bien à "signed"
- [ ] Vérifier que le bouton "Signer" disparaît après signature

### Tests de sécurité
- [ ] Vérifier que les utilisateurs non authentifiés ne peuvent pas uploader
- [ ] Vérifier que les URLs de signature sont publiques
- [ ] Vérifier que les métadonnées de signature ne sont pas modifiables

## Support et maintenance

### Logs et débogage
Les erreurs sont loguées dans la console avec le préfixe :
- `Error uploading signature:`
- `Error updating quote with signature:`
- `Error deleting signature:`

### Monitoring
Surveiller :
- La taille du bucket `signatures` dans Supabase
- Les erreurs d'upload (quota Storage)
- Les tentatives de signature sans authentification

## Conformité légale

### Valeur juridique
⚠️ **Important** : Cette signature électronique est de niveau "simple" selon le règlement eIDAS.

Pour des contrats nécessitant une signature qualifiée, il faut utiliser un prestataire de services de confiance certifié (PSCE).

### Conservation
- Les signatures sont conservées indéfiniment dans Supabase Storage
- Recommandation : mettre en place une politique de backup régulier
- Recommandation : archiver les PDF signés dans un système externe

## Références

- [eIDAS Regulation](https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014R0910)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [@react-pdf/renderer Documentation](https://react-pdf.org/)
