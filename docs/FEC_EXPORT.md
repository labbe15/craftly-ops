# Exports Comptables FEC

## Vue d'ensemble

La fonctionnalité d'export FEC (Fichier des Écritures Comptables) permet de générer un fichier au format standardisé imposé par l'administration fiscale française pour la transmission des écritures comptables.

**Utilité principale :**
- ✅ Transmission à l'expert-comptable
- ✅ Contrôle fiscal (obligation légale en France)
- ✅ Archivage des données comptables
- ✅ Import dans un logiciel comptable

## Qu'est-ce que le FEC ?

Le **FEC** (Fichier des Écritures Comptables) est un format de fichier défini par l'administration fiscale française dans l'article A47 A-1 du LPF (Livre des Procédures Fiscales).

### Obligations légales

**Depuis 2014**, toutes les entreprises tenant leur comptabilité de manière informatisée doivent être en mesure de présenter leur comptabilité sous forme dématérialisée lors d'un contrôle fiscal.

**Référence légale :** BOI-CF-IOR-60-40-20 (Bulletin Officiel des Finances Publiques)

### Format du fichier

- **Extension** : `.txt`
- **Encodage** : UTF-8
- **Séparateur** : Pipe `|`
- **18 colonnes obligatoires**
- **Nom du fichier** : `{SIREN}FEC{AAAAMMJJ}.txt`
  - Exemple : `123456789FEC20231231.txt`

## Architecture

### Service FEC (`src/services/fec-export.service.ts`)

Le service fournit les fonctions suivantes :

#### 1. `generateFEC(options: FECExportOptions): Promise<string>`

Génère le contenu du fichier FEC pour une période donnée.

**Paramètres :**
```typescript
interface FECExportOptions {
  startDate: Date;     // Date de début de période
  endDate: Date;       // Date de fin de période
  siren: string;       // SIREN de l'entreprise (9 chiffres)
}
```

**Retour :** Contenu du fichier FEC au format texte

**Traitement :**
1. Récupération des factures de vente de la période
2. Génération des écritures comptables :
   - Débit client (compte 411xxx)
   - Crédit ventes (compte 706000)
   - Crédit TVA collectée (compte 445710)
   - Écritures de règlement si facture payée (comptes 512000 et 411xxx)

#### 2. `generateFECFilename(siren: string, endDate: Date): string`

Génère le nom du fichier selon la norme.

**Format :** `{SIREN}FEC{AAAAMMJJ}.txt`

#### 3. `downloadFECFile(content: string, filename: string): void`

Déclenche le téléchargement du fichier côté client.

#### 4. `isValidSIREN(siren: string): boolean`

Valide un numéro SIREN (9 chiffres).

### Page Exports (`src/pages/Exports.tsx`)

Interface utilisateur pour générer les exports FEC :

**Champs du formulaire :**
- SIREN de l'entreprise (9 chiffres)
- Date de début de période
- Date de fin de période

**Fonctionnalités :**
- Validation des données (SIREN, dates)
- Indicateur de chargement
- Messages d'erreur clairs
- Informations sur le format FEC
- Téléchargement automatique

## Structure du fichier FEC

### En-tête (18 colonnes)

```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
```

### Colonnes détaillées

| Colonne | Description | Format | Exemple |
|---------|-------------|--------|---------|
| JournalCode | Code du journal | Texte | VT, AC, BQ, OD |
| JournalLib | Libellé du journal | Texte | Ventes, Achats, Banque |
| EcritureNum | Numéro d'écriture unique | Texte | FACT-2024-001 |
| EcritureDate | Date d'écriture | yyyyMMdd | 20240115 |
| CompteNum | Numéro de compte | Texte | 411CXXXXXX |
| CompteLib | Libellé du compte | Texte | Clients |
| CompAuxNum | N° compte auxiliaire | Texte | CXXXXXX |
| CompAuxLib | Libellé compte aux. | Texte | ENTREPRISE DUPONT |
| PieceRef | Référence de la pièce | Texte | FACT-2024-001 |
| PieceDate | Date de la pièce | yyyyMMdd | 20240115 |
| EcritureLib | Libellé de l'écriture | Texte | Facture... |
| Debit | Montant au débit | 0.00 | 1200.00 |
| Credit | Montant au crédit | 0.00 | 1000.00 |
| EcritureLet | Code lettrage | Texte | A, B, C... |
| DateLet | Date de lettrage | yyyyMMdd | 20240120 |
| ValidDate | Date de validation | yyyyMMdd | 20240115 |
| Montantdevise | Montant en devise | 0.00 | (vide si EUR) |
| Idevise | Code devise | Texte | (vide si EUR) |

## Plan comptable utilisé

### Comptes implémentés

| Compte | Libellé | Usage |
|--------|---------|-------|
| **411xxx** | Clients | Compte de tiers (xxx = code client) |
| **706000** | Prestations de services | Ventes de prestations |
| **445710** | TVA collectée | TVA sur ventes |
| **512000** | Banque | Compte de banque principal |

### Codes journaux

| Code | Libellé | Description |
|------|---------|-------------|
| **VT** | Ventes | Journal des ventes |
| **BQ** | Banque | Journal de banque (règlements) |
| **AC** | Achats | Journal des achats (non implémenté) |
| **OD** | Opérations diverses | Autres opérations (non implémenté) |

## Exemple d'écritures générées

### Facture de vente (1200€ TTC = 1000€ HT + 200€ TVA)

```
VT|Ventes|FACT-001|20240115|411CXXXXXX|Clients|CXXXXXX|Client Dupont|FACT-001|20240115|Facture FACT-001|1200.00|0.00|||20240115||
VT|Ventes|FACT-001|20240115|706000|Prestations de services|||FACT-001|20240115|Facture FACT-001|0.00|1000.00|||20240115||
VT|Ventes|FACT-001|20240115|445710|TVA collectée|||FACT-001|20240115|TVA sur facture FACT-001|0.00|200.00|||20240115||
```

### Règlement de la facture (après paiement)

```
BQ|Banque|REG-FACT-001|20240120|512000|Banque|||FACT-001|20240120|Règlement facture FACT-001|1200.00|0.00|A|20240120|20240120||
BQ|Banque|REG-FACT-001|20240120|411CXXXXXX|Clients|CXXXXXX|Client Dupont|FACT-001|20240120|Règlement facture FACT-001|0.00|1200.00|A|20240120|20240120||
```

### Explications

**Facture de vente :**
1. Débit client 1200€ (compte 411)
2. Crédit ventes HT 1000€ (compte 706000)
3. Crédit TVA 200€ (compte 445710)

**Règlement :**
1. Débit banque 1200€ (compte 512000)
2. Crédit client 1200€ (compte 411) - Lettre A pour lier avec la facture

## Utilisation

### 1. Accès à la page Exports

Naviguer vers **Exports** dans le menu principal.

### 2. Remplir le formulaire

1. **SIREN** : Saisir le SIREN de votre entreprise (9 chiffres)
   - Exemple : `123456789`
   - Le SIREN peut être extrait de votre numéro de TVA

2. **Date de début** : Sélectionner le début de la période
   - Généralement : 01/01/AAAA (exercice civil)

3. **Date de fin** : Sélectionner la fin de la période
   - Généralement : 31/12/AAAA (exercice civil)

### 3. Générer l'export

Cliquer sur "Générer l'export FEC"

Le fichier est téléchargé automatiquement avec le nom : `{SIREN}FEC{AAAAMMJJ}.txt`

### 4. Transmettre le fichier

- **Expert-comptable** : Envoyer par email ou plateforme de partage
- **Logiciel comptable** : Importer via la fonction "Import FEC"
- **Archivage** : Sauvegarder dans un système de gestion documentaire

## Périodes recommandées

### Exercice comptable complet

```
Début : 01/01/2024
Fin   : 31/12/2024
```

### Export trimestriel

```
T1 : 01/01/2024 → 31/03/2024
T2 : 01/04/2024 → 30/06/2024
T3 : 01/07/2024 → 30/09/2024
T4 : 01/10/2024 → 31/12/2024
```

### Export mensuel

```
Janvier : 01/01/2024 → 31/01/2024
Février : 01/02/2024 → 29/02/2024
...
```

## Gestion des erreurs

### Validations effectuées

| Erreur | Message |
|--------|---------|
| Période manquante | "Veuillez sélectionner une période" |
| SIREN manquant | "Veuillez saisir le SIREN de votre entreprise" |
| SIREN invalide | "Le SIREN doit contenir exactement 9 chiffres" |
| Date début > Date fin | "La date de début doit être antérieure à la date de fin" |
| Erreur de génération | "Erreur lors de la génération de l'export FEC" |

## Limitations actuelles

### Écritures incluses

✅ **Implémenté :**
- Factures de vente (invoices)
- TVA collectée
- Règlements clients

❌ **Non implémenté :**
- Factures d'achat (fournisseurs)
- TVA déductible
- Immobilisations
- Salaires et charges sociales
- Emprunts
- Opérations diverses

### Plan comptable simplifié

Le plan comptable actuel est simplifié. Il peut nécessiter des ajustements selon :
- Le secteur d'activité
- Le régime fiscal (réel simplifié, réel normal, micro-entreprise)
- Les spécificités de l'entreprise

**Recommandation** : Faire valider le plan comptable par votre expert-comptable.

## Conformité et réglementation

### Références légales

- **Article A47 A-1 du LPF** : Définit le format FEC
- **BOI-CF-IOR-60-40-20** : Bulletin officiel des finances publiques
- **Arrêté du 29 juillet 2013** : Précise les spécifications techniques

### Points de conformité

✅ **Conforme :**
- 18 colonnes obligatoires
- Séparateur pipe
- Encodage UTF-8
- Nomenclature du fichier
- Format des dates (yyyyMMdd)
- Format des montants (0.00)

⚠️ **Attention :**
- Unicité des numéros d'écriture (EcritureNum)
- Cohérence débit/crédit (équilibre)
- Chronologie des écritures

### Conservation

**Durée légale** : 10 ans minimum

**Recommandations** :
- Archiver tous les fichiers FEC générés
- Conserver en plusieurs exemplaires (cloud + local)
- Tester régulièrement la lisibilité des fichiers archivés

## Contrôle fiscal

### Que demande l'administration ?

Lors d'un contrôle fiscal, l'administration peut demander :

1. **FEC de l'exercice contrôlé** (obligatoire)
2. **FEC des exercices N-1, N-2...** (recommandé de les avoir)
3. **Balance comptable**
4. **Grand livre**
5. **Journaux**

### Délai de fourniture

**3 mois** : Délai pour fournir le FEC (en pratique, demandé immédiatement)

### Sanctions

**Défaut de présentation du FEC :**
- Amende de **5 000€** (personne physique)
- Amende de **15 000€** (personne morale)

## Évolutions futures

### Améliorations prévues

1. **Écritures d'achat** :
   - Factures fournisseurs
   - TVA déductible
   - Journal des achats (AC)

2. **Autres journaux** :
   - Opérations diverses (OD)
   - Salaires et charges (PA)
   - Trésorerie détaillée

3. **Plan comptable étendu** :
   - Comptes de classe 2 (Immobilisations)
   - Comptes de classe 6 (Charges)
   - Comptes de classe 7 (Produits)

4. **Lettrage automatique** :
   - Rapprochement factures/règlements
   - Lettrage intelligent

5. **Validation du FEC** :
   - Contrôle de cohérence
   - Équilibre débit/crédit
   - Test de conformité

6. **Import FEC** :
   - Réimport d'un FEC existant
   - Synchronisation avec logiciel comptable

## Support et assistance

### Problèmes fréquents

**Q : Le fichier téléchargé est vide**
**R :** Vérifiez qu'il y a des factures dans la période sélectionnée

**Q : Mon expert-comptable dit que le fichier est invalide**
**R :** Vérifiez le format (séparateur pipe, encodage UTF-8). Contactez-nous si le problème persiste.

**Q : Dois-je générer un FEC chaque mois ?**
**R :** Non, sauf demande spécifique. Un FEC annuel suffit généralement.

**Q : Que faire si mon exercice est décalé (pas 01/01 → 31/12) ?**
**R :** Sélectionnez les dates de votre exercice comptable (ex: 01/07 → 30/06)

### Ressources utiles

- [Spécifications FEC (PDF)](https://bofip.impots.gouv.fr/)
- [Guide de l'administration fiscale](https://www.impots.gouv.fr/)
- Support expert-comptable

## Glossaire

| Terme | Définition |
|-------|------------|
| **FEC** | Fichier des Écritures Comptables |
| **SIREN** | Système d'Identification du Répertoire des ENtreprises (9 chiffres) |
| **SIRET** | SIREN + NIC (14 chiffres) - identifie un établissement |
| **Plan comptable** | Nomenclature des comptes comptables |
| **Lettrage** | Rapprochement de deux écritures (ex: facture + règlement) |
| **Débit/Crédit** | Principe de la comptabilité en partie double |
| **Journal** | Regroupement d'écritures de même nature |
| **Exercice** | Période comptable (généralement 12 mois) |

## Conformité RGPD

### Données dans le FEC

Le FEC contient :
- ✅ Noms de clients (données professionnelles)
- ✅ Montants de transactions
- ❌ Aucune donnée personnelle sensible

**Base légale** : Obligation légale comptable et fiscale

**Conservation** : 10 ans (durée légale)

**Transmission** : Uniquement à l'expert-comptable et l'administration fiscale
