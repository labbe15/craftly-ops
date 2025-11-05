# Intégration API Pappers

## Vue d'ensemble

L'intégration de l'API Pappers permet l'auto-complétion des informations d'entreprise lors de la création ou modification d'un client en saisissant simplement le numéro SIRET.

**Avantages :**
- ✅ Gain de temps considérable lors de la saisie
- ✅ Réduction des erreurs de saisie
- ✅ Données officielles et à jour (base INPI)
- ✅ Gratuit jusqu'à 250 requêtes/mois

## Prérequis

### 1. Obtenir une clé API Pappers

1. Créer un compte sur [Pappers.fr](https://www.pappers.fr/)
2. Se rendre dans la section [API](https://www.pappers.fr/api)
3. Générer une clé API gratuite
4. Copier la clé API

### 2. Configuration de l'environnement

Ajouter la clé API dans le fichier `.env` :

```env
VITE_PAPPERS_API_KEY=votre-cle-api-ici
```

⚠️ **Important** : Ne jamais committer la clé API dans le repository Git !

## Architecture

### Service Pappers (`src/services/pappers.service.ts`)

Le service fournit les fonctions suivantes :

#### 1. `searchBySiret(siret: string): Promise<CompanyInfo>`

Recherche une entreprise par son numéro SIRET (14 chiffres).

**Paramètres :**
- `siret` : Numéro SIRET de l'entreprise (avec ou sans espaces)

**Retour :**
```typescript
interface CompanyInfo {
  siret: string;          // SIRET nettoyé
  name: string;           // Raison sociale complète
  address: string;        // Adresse du siège social
  vatNumber?: string;     // N° TVA intracommunautaire
  legalForm?: string;     // Forme juridique (SARL, SAS, etc.)
  registrationCity?: string; // Ville d'immatriculation RCS
}
```

**Erreurs possibles :**
- Clé API non configurée
- SIRET invalide (pas 14 chiffres)
- Entreprise introuvable
- Limite de requêtes dépassée (429)
- Clé API invalide (401)

**Exemple :**
```typescript
try {
  const company = await searchBySiret("12345678901234");
  console.log(company.name); // "ENTREPRISE EXEMPLE SAS"
} catch (error) {
  console.error(error.message);
}
```

#### 2. `searchBySiren(siren: string): Promise<CompanyInfo>`

Recherche une entreprise par son numéro SIREN (9 chiffres).

**Paramètres :**
- `siren` : Numéro SIREN de l'entreprise

**Retour :** Identique à `searchBySiret`

#### 3. `searchByName(query: string, maxResults?: number): Promise<PappersSearchResult>`

Recherche des entreprises par nom (non utilisé actuellement mais disponible).

**Paramètres :**
- `query` : Nom de l'entreprise à rechercher (min. 2 caractères)
- `maxResults` : Nombre maximum de résultats (défaut: 10)

#### 4. Fonctions utilitaires

- `isValidSiret(siret: string): boolean` - Valide un SIRET
- `isValidSiren(siren: string): boolean` - Valide un SIREN
- `formatSiret(siret: string): string` - Formate un SIRET (XXX XXX XXX XXXXX)
- `formatSiren(siren: string): string` - Formate un SIREN (XXX XXX XXX)

## Base de données

### Migration : `20251105_add_client_legal_info.sql`

Ajouts à la table `clients` :
```sql
siret VARCHAR(14)             -- Numéro SIRET
vat_number VARCHAR(50)        -- N° TVA intracommunautaire
legal_form VARCHAR(100)       -- Forme juridique
registration_city VARCHAR(255) -- Ville RCS
```

**Index créé :**
- `idx_clients_siret` sur la colonne `siret` pour les recherches rapides

## Utilisation dans l'interface

### ClientForm

Le formulaire de création/modification de client a été enrichi avec :

#### 1. Section SIRET avec auto-complétion

**Emplacement :** En haut du formulaire, avant les informations de base

**Composants :**
- Champ de saisie SIRET (14 chiffres max)
- Bouton "Rechercher" avec icône de recherche
- Indicateur de chargement pendant la requête API
- Message informatif

**Comportement :**
1. L'utilisateur saisit un SIRET
2. Clic sur "Rechercher"
3. Validation du format (14 chiffres)
4. Appel à l'API Pappers
5. Auto-remplissage des champs :
   - Nom de l'entreprise
   - Adresse
   - SIRET (formaté)
   - N° TVA
   - Forme juridique
   - Ville RCS

**États du bouton :**
- Désactivé si le champ SIRET est vide
- Affiche "Recherche..." avec spinner pendant l'appel API
- Réactivé après la réponse

#### 2. Nouveaux champs affichés

**Champs ajoutés au formulaire :**
- N° TVA intracommunautaire (1/3 de largeur)
- Forme juridique (1/3 de largeur)
- Ville RCS (1/3 de largeur)

Ces champs peuvent être modifiés manuellement même après auto-complétion.

## Gestion des erreurs

### Erreurs utilisateur

Toutes les erreurs sont affichées via des toasts (sonner) :

| Erreur | Message |
|--------|---------|
| Champ SIRET vide | "Veuillez saisir un numéro SIRET" |
| SIRET invalide | "Le SIRET doit contenir 14 chiffres" |
| Entreprise introuvable | "Aucune entreprise trouvée avec ce SIRET" |
| Clé API invalide | "Clé API Pappers invalide" |
| Quota dépassé | "Limite de requêtes API dépassée. Veuillez réessayer plus tard." |
| Clé API manquante | "Clé API Pappers non configurée. Veuillez ajouter VITE_PAPPERS_API_KEY dans votre fichier .env" |

### Logging

Toutes les erreurs sont loguées dans la console :
```typescript
console.error("Error fetching company data:", error);
```

## Limites et quotas

### Plan gratuit Pappers

- **250 requêtes/mois** incluses gratuitement
- Au-delà : Plans payants disponibles
- Pas de limite de débit (rate limit)

### Recommandations

1. **Monitoring** : Suivre le nombre de requêtes mensuelles
2. **Cache** : Ne pas implémenter de cache côté client (données changeantes)
3. **Validation** : Toujours valider le SIRET avant l'appel API

## Sécurité

### Protection de la clé API

✅ **Bon** :
- Clé stockée dans variable d'environnement
- Variable préfixée par `VITE_` pour Vite
- Fichier `.env` dans `.gitignore`

⚠️ **Attention** :
- La clé API est exposée côté client (build frontend)
- Utiliser les restrictions d'API Pappers si disponibles
- Considérer un proxy backend pour les projets sensibles

### Alternative : Proxy backend

Pour plus de sécurité, créer une route API backend :

```typescript
// Supabase Edge Function ou API route
export async function POST(request: Request) {
  const { siret } = await request.json();

  // Valider le SIRET
  // Appeler l'API Pappers avec la clé stockée côté serveur
  // Retourner les données
}
```

## Tests

### Tests manuels recommandés

- [ ] Rechercher avec un SIRET valide
- [ ] Rechercher avec un SIRET invalide (< 14 chiffres)
- [ ] Rechercher avec un SIRET inexistant
- [ ] Vérifier l'auto-remplissage de tous les champs
- [ ] Modifier manuellement les champs après auto-complétion
- [ ] Créer un client avec les données auto-remplies
- [ ] Tester sans clé API configurée

### SIRETs de test

Quelques SIRETs réels pour tester :

- `12000101100010` - Renault SAS
- `55208779717902` - Apple France
- `38784097900125` - Microsoft France

## Évolutions futures

### Améliorations possibles

1. **Recherche par nom** : Permettre de chercher une entreprise par son nom
2. **Suggestions** : Auto-complétion pendant la saisie du SIRET
3. **Historique** : Sauvegarder les recherches récentes
4. **Validation temps réel** : Vérifier le SIRET pendant la saisie
5. **Cache local** : Mémoriser les résultats récents (attention aux données périmées)
6. **Autres APIs** :
   - API Sirene (INSEE) - Gratuite mais moins de données
   - API Société.com - Plus de données juridiques
   - API Infogreffe - Données RCS officielles

### Monitoring et analytics

Ajouter le tracking pour :
- Nombre de recherches par jour/mois
- Taux de succès/échec
- SIRETs les plus recherchés
- Alertes quota (80%, 90%, 100%)

## Support

### Ressources

- [Documentation API Pappers](https://www.pappers.fr/api/documentation)
- [FAQ Pappers](https://www.pappers.fr/faq)
- [Support Pappers](https://www.pappers.fr/contact)

### Dépannage

**Problème** : "Clé API Pappers non configurée"
**Solution** : Vérifier que `VITE_PAPPERS_API_KEY` est bien dans `.env` et redémarrer le serveur de dev

**Problème** : "Limite de requêtes dépassée"
**Solution** : Attendre le mois suivant ou upgrader vers un plan payant

**Problème** : Les données ne s'auto-remplissent pas
**Solution** : Vérifier la console pour les erreurs, vérifier le format du SIRET

## Conformité RGPD

### Données collectées

L'API Pappers retourne des données **publiques** issues du registre national des entreprises (RNE).

**Type de données** : Données d'entreprises, non personnelles

**Base légale** : Données publiques accessibles à tous

**Conservation** : Les données sont stockées uniquement dans la base clients (pas de cache supplémentaire)

### Informations utilisateur

Aucune donnée utilisateur n'est transmise à Pappers lors des requêtes API.
