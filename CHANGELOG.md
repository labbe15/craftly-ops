# Changelog

Toutes les modifications notables apportées à Craftly Ops seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [1.1.0] - 2025-10-21

### 🚀 Ajouts

#### Qualité & Robustesse
- **TypeScript Strict Mode** : Mode strict activé pour une meilleure sécurité de type
- **Validation Zod complète** : Schémas de validation pour clients, items et variables d'environnement
- **Error Boundary** : Gestion gracieuse des erreurs avec interface utilisateur dédiée
- **Gestionnaire d'erreurs global** : Gestion centralisée des erreurs avec messages adaptés

#### UX/UI
- **Dark Mode** : Thème sombre avec switch dans la TopBar (clair/sombre/système)
- **ThemeProvider** : Gestion du thème avec persistance localStorage
- **Skeleton loaders** : États de chargement élégants

#### Fonctionnalités Métier
- **Génération PDF** : Export professionnel de devis et factures en PDF
  - Template personnalisable
  - En-têtes et pieds de page
  - Calculs automatiques des totaux
  - Formatage des dates en français
- **Export de données** : Export CSV et Excel
  - Export clients, items, devis, factures
  - Renommage des colonnes
  - Auto-dimensionnement des colonnes Excel
  - Support multi-feuilles
- **Hook de confirmation** : Dialogs de confirmation pour les actions dangereuses

#### DevOps & Qualité
- **CI/CD GitHub Actions** :
  - Workflow de build et test automatique
  - Lint et type-checking
  - Security audit
  - Workflow de déploiement (template)
- **Pre-commit hooks** : Husky + lint-staged
  - ESLint auto-fix
  - Type-checking avant commit
  - Formatage Prettier automatique
- **Configuration Prettier** : Code style cohérent

### 🔧 Améliorations

#### Configuration
- Mode strict TypeScript pour tout le projet
- Meilleure gestion des erreurs Supabase
- Configuration lint-staged pour qualité du code

#### Dépendances
- `@react-pdf/renderer` : Génération de PDF
- `jspdf` + `jspdf-autotable` : Alternative PDF plus légère
- `xlsx` : Export Excel
- `papaparse` : Export CSV
- `framer-motion` : Animations (préparé pour usage futur)
- `husky` + `lint-staged` : Pre-commit hooks

### 📚 Documentation
- **CHANGELOG.md** : Ce fichier
- **IMPROVEMENTS.md** : Roadmap complète des améliorations
- README.md mis à jour avec nouvelles fonctionnalités

### 🏗️ Infrastructure
- `.github/workflows/ci.yml` : Workflow CI/CD
- `.github/workflows/deploy.yml` : Template de déploiement
- `.lintstagedrc.json` : Configuration lint-staged
- `.prettierrc` : Configuration Prettier

### 🐛 Corrections
- Fermeture correcte du ThemeProvider dans App.tsx
- Gestion des erreurs réseau améliorée

---

## [1.0.0] - 2025-10-21

### 🚀 Version Initiale

#### Fonctionnalités de base
- Authentification Supabase
- Gestion des clients (CRUD complet)
- Gestion des items/articles (CRUD complet)
- Dashboard avec statistiques dynamiques
- Multi-tenant sécurisé avec RLS
- Interface shadcn/ui avec Tailwind CSS

#### Sécurité
- Row Level Security (RLS) Supabase
- Isolation des données par organisation
- Auto-provisioning des organisations

#### Documentation
- README.md complet
- DEPLOYMENT.md avec guides détaillés
- Configuration .env.example

---

## [À venir]

### Version 1.2.0 (Planifié)
- [ ] Command Palette (Cmd+K) pour recherche globale
- [ ] Animations Framer Motion sur les transitions
- [ ] Workflow avancé des devis/factures (pipeline)
- [ ] Tests unitaires avec Vitest
- [ ] Storybook pour documentation des composants

### Version 1.3.0 (Planifié)
- [ ] Envoi d'emails automatiques
- [ ] Dashboard analytics avancé avec graphiques
- [ ] PWA avec support offline
- [ ] Notifications push

### Version 2.0.0 (Vision)
- [ ] Features IA pour auto-complétion
- [ ] Intégrations tierces (Stripe, Calendar)
- [ ] Mode multi-utilisateur par organisation
- [ ] Application mobile (React Native)

---

**Légende**
- 🚀 Ajouts
- 🔧 Améliorations
- 🐛 Corrections
- 🗑️ Suppressions
- 📚 Documentation
- 🏗️ Infrastructure
