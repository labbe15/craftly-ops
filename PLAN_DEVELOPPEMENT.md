# PLAN DE DÉVELOPPEMENT - CRAFTLY OPS
## 📊 État actuel du projet (Novembre 2025)

### ✅ FONCTIONNALITÉS DÉJÀ IMPLÉMENTÉES

#### 1. Fondations (100%)
- ✅ React 18 + TypeScript + Vite
- ✅ Shadcn/ui - Design system complet
- ✅ TailwindCSS - Styling
- ✅ React Router v6 - Navigation
- ✅ Supabase - Auth + Database + Storage
- ✅ React Query - State management
- ✅ Layout principal (AppLayout + Sidebar + TopBar)

#### 2. Authentification (100%)
- ✅ Login/Signup avec Supabase Auth
- ✅ Row Level Security (RLS) configurée
- ✅ Session management
- ⏸️ 2FA (à implémenter)
- ⏸️ OAuth (Google, Microsoft)

#### 3. CRM - Gestion Clients (70%)
- ✅ CRUD complet clients
- ✅ Fiche client détaillée
- ✅ Intégration API Pappers (auto-complétion SIRET)
- ✅ Champs légaux (SIRET, TVA, forme juridique)
- ⏸️ Système de tags avancé
- ⏸️ Contacts multiples par client
- ⏸️ Segmentation & filtres avancés
- ⏸️ Géolocalisation / carte
- ⏸️ Historique complet (timeline)

#### 4. Devis & Factures (80%)
- ✅ Générateur de devis complet
- ✅ Générateur de factures
- ✅ Quote items / Invoice items
- ✅ Génération PDF (@react-pdf/renderer)
- ✅ Signature électronique
- ✅ Conversion devis → facture
- ✅ Envoi par email (Resend)
- ✅ Gestion des paiements
- ⏸️ Templates PDF multiples
- ⏸️ Factures récurrentes
- ⏸️ Relances automatiques
- ⏸️ Paiements en ligne (Stripe)
- ⏸️ QR codes de paiement

#### 5. Catalogue Produits/Services (90%)
- ✅ CRUD items (produits/services)
- ✅ Prix HT, TVA, unités
- ⏸️ Catégories hiérarchiques
- ⏸️ Images produits
- ⏸️ Gestion stock
- ⏸️ Fournisseurs

#### 6. Agenda (70%)
- ✅ CRUD événements
- ✅ Vue calendrier (basique)
- ✅ Liaison clients/devis/factures
- ⏸️ Vues multiples (jour/semaine/mois/Gantt)
- ⏸️ Sync Google Calendar
- ⏸️ Rappels automatiques
- ⏸️ Récurrence d'événements

#### 7. Dashboard (60%)
- ✅ KPIs de base (CA, factures, devis, clients)
- ✅ Stats mois courant vs mois précédent
- ✅ Liste derniers devis/factures
- ✅ Alertes factures en retard
- ⏸️ Graphiques avancés (Recharts/ECharts)
- ⏸️ Widgets personnalisables (drag & drop)
- ⏸️ Pipeline de ventes (kanban)
- ⏸️ Prévisions CA

#### 8. Exports & Comptabilité (50%)
- ✅ Export FEC (Fichier Écritures Comptables)
- ⏸️ Exports CSV/Excel personnalisables
- ⏸️ Rapports comptables avancés
- ⏸️ Déclaration TVA

#### 9. Documents (40%)
- ✅ Upload de fichiers (Supabase Storage)
- ✅ Stockage signatures
- ⏸️ Bibliothèque documentaire complète
- ⏸️ OCR & extraction de données
- ⏸️ Organisation par tags/dossiers
- ⏸️ Partage sécurisé
- ⏸️ Versioning

#### 10. Paramètres (70%)
- ✅ Configuration entreprise (org_settings)
- ✅ Préfixes devis/factures
- ✅ Taux TVA par défaut
- ✅ Délais de paiement
- ⏸️ Templates emails personnalisables
- ⏸️ Templates PDF personnalisables
- ⏸️ Multi-utilisateurs & rôles

### ❌ FONCTIONNALITÉS MANQUANTES (Prioritaires)

#### 1. PROJETS / CHANTIERS (0%)
- ❌ Table `projects` dans DB
- ❌ Kanban des projets (Lead → En cours → Terminé)
- ❌ Fiche projet détaillée
- ❌ Gestion d'équipe & assignations
- ❌ Suivi temps & pointages
- ❌ Matériaux & fournisseurs par projet
- ❌ Photos chantiers (avant/pendant/après)
- ❌ Timeline du projet
- ❌ Calcul rentabilité (budget vs réel)
- ❌ Tâches par projet (checklist)

#### 2. RECHERCHE GLOBALE (0%)
- ❌ Barre de recherche Cmd+K (spotlight-like)
- ❌ Recherche multi-entités
- ❌ Recherche full-text
- ❌ Opérateurs de recherche
- ❌ Historique des recherches

#### 3. ANALYTICS & RAPPORTS (10%)
- ❌ Dashboard analytique avancé
- ❌ Graphiques interactifs (drill-down)
- ❌ Prévisions ML
- ❌ Segmentation RFM clients
- ❌ Cohort analysis
- ❌ Rapports personnalisables
- ❌ Planification envoi automatique

#### 4. INTELLIGENCE ARTIFICIELLE (0%)
- ❌ Chatbot "Craftly AI" (OpenAI GPT-4)
- ❌ Commandes vocales (Whisper STT)
- ❌ OCR factures fournisseurs
- ❌ Analyse photos chantiers (Vision AI)
- ❌ Génération devis depuis photo
- ❌ Assistant email (tri, suggestions)
- ❌ Prédictions (CA, churn)
- ❌ Génération contenu marketing

#### 5. AUTOMATISATIONS (0%)
- ❌ Workflow builder visuel (no-code)
- ❌ Déclencheurs (événements, temporels, conditions)
- ❌ Actions (emails, SMS, webhooks, IA)
- ❌ Templates de workflows
- ❌ Intégrations (Zapier, n8n, Google, Slack)

#### 6. MOBILE & PWA (20%)
- ⚠️ Responsive design (partiel)
- ❌ PWA installable
- ❌ Mode offline
- ❌ Notifications push
- ❌ Fonctionnalités mobiles (scan, photo, GPS)

#### 7. MULTI-UTILISATEURS (0%)
- ❌ Table `users` étendue
- ❌ Rôles & permissions (RBAC)
- ❌ Invitations équipe
- ❌ Logs d'activité par user
- ❌ Messagerie interne
- ❌ Collaboration temps réel

---

## 🎯 ROADMAP PAR PHASES

### PHASE 4 : PROJETS & CHANTIERS (Priorité HAUTE)
**Objectif :** Implémenter la gestion complète des chantiers
**Durée estimée :** 2-3 semaines

#### Étape 4.1 : Base de données Projets
- [ ] Créer migration `projects` table
- [ ] Créer migration `project_tasks` table
- [ ] Créer migration `project_materials` table
- [ ] Créer migration `project_team` table
- [ ] Créer migration `time_entries` table (pointages)
- [ ] Ajouter RLS policies
- [ ] Créer relations avec clients, quotes, invoices

**Tables nécessaires :**
```sql
-- projects
id, org_id, client_id, name, description, type, status,
start_date, end_date, deadline, address, gps_coordinates,
budget_quoted, budget_actual, margin_percentage,
progress_percentage, priority, tags, custom_fields,
created_at, updated_at

-- project_tasks
id, project_id, title, description, status, priority,
assigned_to, due_date, completed_at, estimated_hours,
actual_hours, checklist (jsonb), created_at, updated_at

-- project_materials
id, project_id, item_id, supplier_id, quantity,
unit_price, status (ordered/delivered/used),
ordered_at, delivered_at, notes

-- project_team
id, project_id, user_id, role, assigned_at

-- time_entries
id, project_id, user_id, task_id, start_time, end_time,
duration_hours, notes, billable, created_at
```

#### Étape 4.2 : UI Projets
- [ ] Page liste projets (Projects.tsx)
- [ ] Kanban board (dnd-kit)
- [ ] Fiche projet détaillée (ProjectDetail.tsx)
- [ ] Formulaire création/édition projet
- [ ] Widget projets actifs sur Dashboard
- [ ] Liens projets dans fiche client

#### Étape 4.3 : Gestion des Tâches
- [ ] Composant TaskList
- [ ] Composant TaskItem (checkbox, édition inline)
- [ ] Drag & drop pour réorganiser
- [ ] Dépendances entre tâches
- [ ] Timer de pointage (start/stop)

#### Étape 4.4 : Photos & Documents
- [ ] Upload photos chantier (Supabase Storage)
- [ ] Organisation par date/type
- [ ] Galerie photos (avant/pendant/après)
- [ ] Annotations sur photos
- [ ] Timeline visuelle

#### Étape 4.5 : Rentabilité
- [ ] Calculs automatiques budget vs réel
- [ ] Affichage marge prévisionnelle
- [ ] Graphique évolution coûts
- [ ] Alertes dépassement budget

---

### PHASE 5 : RECHERCHE GLOBALE (Priorité HAUTE)
**Objectif :** Recherche universelle Cmd+K
**Durée estimée :** 1 semaine

#### Étape 5.1 : Composant Search
- [ ] Créer GlobalSearch.tsx (dialog cmd+k)
- [ ] Utiliser cmdk (déjà installé)
- [ ] Design moderne (style Linear/Notion)
- [ ] Raccourci clavier (Cmd/Ctrl+K)

#### Étape 5.2 : Recherche Multi-entités
- [ ] Service de recherche unifié
- [ ] Recherche clients (nom, email, phone, SIRET)
- [ ] Recherche projets (nom, adresse)
- [ ] Recherche devis (number, montant)
- [ ] Recherche factures (number, montant)
- [ ] Recherche produits (nom, description)
- [ ] Classement par pertinence

#### Étape 5.3 : Fonctionnalités Avancées
- [ ] Filtres par type d'entité
- [ ] Opérateurs de recherche (exact, >, <, date:)
- [ ] Historique des recherches
- [ ] Actions rapides depuis résultats
- [ ] Navigation clavier complète

---

### PHASE 6 : ANALYTICS AVANCÉS (Priorité MOYENNE)
**Objectif :** Dashboard business intelligence
**Durée estimée :** 2 semaines

#### Étape 6.1 : Installation bibliothèques
- [ ] Installer Apache ECharts (si Recharts insuffisant)
- [ ] Setup data transformation utilities

#### Étape 6.2 : Graphiques Dashboard
- [ ] Graphique CA (ligne + barres combinées)
- [ ] Donut chart répartition CA par type
- [ ] Funnel conversion devis
- [ ] Bar chart rentabilité par projet
- [ ] Heatmap saisonnalité
- [ ] Widgets drag & drop (react-grid-layout)

#### Étape 6.3 : Page Analytics dédiée
- [ ] Créer Analytics.tsx
- [ ] Filtres période personnalisée
- [ ] Comparaisons (N vs N-1, budget vs réel)
- [ ] KPIs avancés (CAC, LTV, DSO, EBITDA)
- [ ] Exports graphiques (PNG, PDF)

#### Étape 6.4 : Rapports Personnalisés
- [ ] Créer ReportBuilder.tsx
- [ ] Table `saved_reports`
- [ ] Sélection métriques & dimensions
- [ ] Filtres avancés
- [ ] Sauvegarde & partage rapports
- [ ] Planification envoi email

---

### PHASE 7 : IA FOUNDATION (Priorité HAUTE)
**Objectif :** Chatbot IA + fonctionnalités de base
**Durée estimée :** 3 semaines

#### Étape 7.1 : Configuration OpenAI
- [ ] Ajouter VITE_OPENAI_API_KEY
- [ ] Créer service OpenAI (openai.service.ts)
- [ ] Setup edge function pour proxy (sécurité)
- [ ] Table `ai_conversations` (historique)

#### Étape 7.2 : Chatbot UI
- [ ] Créer ChatBot.tsx (bulle bottom-right)
- [ ] Page dédiée Chat.tsx
- [ ] Interface conversationnelle
- [ ] Historique conversations
- [ ] Context-aware (détection page actuelle)

#### Étape 7.3 : Capacités Conversationnelles
- [ ] Recherche données ("Trouve client Dupont")
- [ ] Statistiques ("Quel est mon CA ce mois?")
- [ ] Actions simples ("Crée devis pour Martin")
- [ ] Suggestions contextuelles
- [ ] Fonction calling (OpenAI)

#### Étape 7.4 : Génération de Contenu
- [ ] Rédaction emails (relances, remerciements)
- [ ] Descriptions produits/services
- [ ] Descriptions projets
- [ ] Templates emails intelligents

#### Étape 7.5 : Commandes Vocales
- [ ] Intégration Whisper (STT)
- [ ] Bouton micro dans chat
- [ ] Transcription temps réel
- [ ] TTS pour réponses vocales (optionnel)

---

### PHASE 8 : IA AVANCÉE (Priorité MOYENNE)
**Objectif :** Vision AI, OCR, Prédictions
**Durée estimée :** 3 semaines

#### Étape 8.1 : OCR Factures Fournisseurs
- [ ] Upload facture PDF/image
- [ ] Extraction via GPT-4 Vision
- [ ] Parsing : fournisseur, montant, date, lignes
- [ ] Création automatique dans dépenses
- [ ] Validation manuelle

#### Étape 8.2 : Analyse Photos Chantiers
- [ ] Upload photo chantier
- [ ] Analyse GPT-4 Vision :
  - Détection type de travaux
  - Estimation dimensions
  - Reconnaissance matériaux
  - Qualité finition
  - Détection anomalies

#### Étape 8.3 : Génération Devis depuis Photo
- [ ] Upload photo espace à rénover
- [ ] IA pose questions complémentaires
- [ ] Estimation matériaux nécessaires
- [ ] Calcul temps de travail
- [ ] Génération devis détaillé automatique

#### Étape 8.4 : Prédictions & Recommandations
- [ ] Prévisions CA (ML basique)
- [ ] Détection clients à risque (churn)
- [ ] Scoring probabilité conversion devis
- [ ] Suggestions pricing
- [ ] Optimisation planning

#### Étape 8.5 : Assistant Email
- [ ] Classification emails entrants
- [ ] Détection urgence
- [ ] Génération réponses suggérées
- [ ] Résumés automatiques
- [ ] Suivi & relances intelligentes

---

### PHASE 9 : AUTOMATISATIONS (Priorité MOYENNE)
**Objectif :** Workflow builder no-code
**Durée estimée :** 3 semaines

#### Étape 9.1 : Base de données Workflows
- [ ] Table `workflows`
- [ ] Table `workflow_executions`
- [ ] Table `workflow_logs`
- [ ] Stockage config (jsonb)

#### Étape 9.2 : Workflow Builder UI
- [ ] Créer WorkflowBuilder.tsx
- [ ] Interface drag & drop (reactflow ou custom)
- [ ] Blocs déclencheurs (triggers)
- [ ] Blocs conditions (if/then)
- [ ] Blocs actions
- [ ] Connexions visuelles

#### Étape 9.3 : Déclencheurs
- [ ] Événements (nouveau client, devis accepté, etc.)
- [ ] Temporels (cron-like)
- [ ] Webhooks entrants
- [ ] Conditions (montant >, client avec tag, etc.)

#### Étape 9.4 : Actions
- [ ] Envoyer email (Resend)
- [ ] Envoyer SMS (Twilio)
- [ ] Créer/modifier enregistrement
- [ ] Appeler IA
- [ ] Webhook sortant
- [ ] Attendre X jours

#### Étape 9.5 : Templates Pré-configurés
- [ ] Onboarding nouveau client
- [ ] Relance devis
- [ ] Cycle de facturation
- [ ] Rappel paiement
- [ ] Reporting automatique
- [ ] Signature contrat

#### Étape 9.6 : Intégrations
- [ ] Google Calendar (sync bidirectionnelle)
- [ ] Google Drive (sauvegarde docs)
- [ ] Stripe (paiements)
- [ ] Slack (notifications)
- [ ] Zapier (webhook)
- [ ] n8n (webhook)

---

### PHASE 10 : MOBILE & PWA (Priorité MOYENNE)
**Objectif :** Application installable + offline
**Durée estimée :** 2 semaines

#### Étape 10.1 : Configuration PWA
- [ ] Installer vite-plugin-pwa
- [ ] Créer manifest.json
- [ ] Configurer service workers
- [ ] Icônes app (différentes tailles)
- [ ] Splash screen

#### Étape 10.2 : Mode Offline
- [ ] Cache stratégique (données essentielles)
- [ ] Queue d'actions hors ligne
- [ ] Sync au retour online
- [ ] Indicateur de statut

#### Étape 10.3 : Notifications Push
- [ ] Setup Firebase Cloud Messaging (ou Supabase Realtime)
- [ ] Gestion permissions
- [ ] Envoi notifications serveur
- [ ] Clics sur notifications

#### Étape 10.4 : Optimisations Mobile
- [ ] Revue complète responsive
- [ ] Bottom navigation pour mobile
- [ ] Swipe gestures
- [ ] Touch-friendly (44px min)
- [ ] Amélioration perf mobile

#### Étape 10.5 : Fonctionnalités Natives
- [ ] Scan QR codes (html5-qrcode)
- [ ] Scan codes-barres
- [ ] Prise de photo directe
- [ ] Géolocalisation
- [ ] Click-to-call
- [ ] Native share

---

### PHASE 11 : MULTI-UTILISATEURS (Priorité BASSE)
**Objectif :** Gestion d'équipe & rôles
**Durée estimée :** 2 semaines

#### Étape 11.1 : Base de données Users
- [ ] Étendre table users (Supabase Auth)
- [ ] Table `team_members`
- [ ] Table `roles` & `permissions`
- [ ] Migration données existantes

#### Étape 11.2 : Système RBAC
- [ ] Définir rôles (Owner, Admin, Manager, User, Accountant)
- [ ] Permissions granulaires
- [ ] Middleware de vérification
- [ ] RLS policies par rôle

#### Étape 11.3 : Gestion Équipe
- [ ] Page Team.tsx
- [ ] Invitations par email
- [ ] Activation/désactivation users
- [ ] Assignation rôles
- [ ] Logs d'activité

#### Étape 11.4 : Collaboration
- [ ] Assignations (projets, tâches, clients)
- [ ] @mentions dans commentaires
- [ ] Notifications temps réel
- [ ] Messagerie interne (optionnel)

---

### PHASE 12 : POLISH & OPTIMISATIONS (Priorité CONTINUE)
**Objectif :** Performance, UX, sécurité
**Durée estimée :** Continu

#### Étape 12.1 : Performance
- [ ] Code splitting route-based
- [ ] Lazy loading composants lourds
- [ ] Optimisation images (WebP, lazy load)
- [ ] Virtualization listes longues (TanStack Virtual)
- [ ] Bundle size analysis
- [ ] Lighthouse score > 90

#### Étape 12.2 : UX/UI
- [ ] Skeletons de chargement partout
- [ ] Empty states bien designés
- [ ] Error boundaries
- [ ] Toasts & confirmations cohérentes
- [ ] Animations micro (framer-motion)
- [ ] Mode sombre complet

#### Étape 12.3 : Accessibilité
- [ ] Audit WCAG 2.1 AA
- [ ] Navigation clavier complète
- [ ] Screen reader support
- [ ] Contraste suffisant
- [ ] Labels ARIA

#### Étape 12.4 : Sécurité
- [ ] 2FA (TOTP)
- [ ] OAuth (Google, Microsoft)
- [ ] Rate limiting API
- [ ] Audit RLS policies
- [ ] Content Security Policy
- [ ] Logs d'audit complets

#### Étape 12.5 : Tests
- [ ] Tests E2E (Playwright)
- [ ] Tests d'intégration
- [ ] Tests unitaires composants critiques
- [ ] CI/CD avec tests automatiques

#### Étape 12.6 : Documentation
- [ ] Guide utilisateur complet
- [ ] Vidéos tutoriels
- [ ] FAQ
- [ ] Onboarding interactif
- [ ] Centre d'aide (docs.craftly-ops.com)

---

## 📅 TIMELINE RECOMMANDÉE

### Sprint 1 (Semaines 1-2) : PROJETS & CHANTIERS
- Migration DB projets
- UI Kanban & fiche projet
- Gestion tâches & pointages

### Sprint 2 (Semaine 3) : RECHERCHE GLOBALE
- Composant GlobalSearch Cmd+K
- Recherche multi-entités
- Actions rapides

### Sprint 3 (Semaines 4-5) : ANALYTICS
- Graphiques Dashboard avancés
- Page Analytics
- Rapports personnalisables

### Sprint 4 (Semaines 6-8) : IA FOUNDATION
- Setup OpenAI
- Chatbot UI
- Recherche & actions conversationnelles
- Génération contenu

### Sprint 5 (Semaines 9-11) : IA AVANCÉE
- OCR factures
- Analyse photos
- Génération devis AI
- Prédictions

### Sprint 6 (Semaines 12-14) : AUTOMATISATIONS
- Workflow builder
- Templates workflows
- Intégrations (Google, Stripe, Slack)

### Sprint 7 (Semaines 15-16) : PWA & MOBILE
- Configuration PWA
- Mode offline
- Push notifications
- Optimisations mobile

### Sprint 8 (Semaines 17-18) : MULTI-USERS
- RBAC
- Gestion équipe
- Collaboration

### Sprint 9 (Semaines 19-20) : POLISH
- Performance
- Sécurité (2FA, OAuth)
- Tests E2E
- Documentation

---

## 🎯 QUICK WINS (Actions rapides à impact élevé)

### Quick Win 1 : Améliorer Dashboard (2 jours)
- [ ] Ajouter graphique CA (Recharts)
- [ ] Ajouter graphique conversion devis (funnel)
- [ ] Card projets actifs
- [ ] Widgets drag & drop

### Quick Win 2 : Système de Tags (1 jour)
- [ ] Table `tags`
- [ ] Composant TagInput
- [ ] Filtrage par tags (clients, projets)
- [ ] Tags colorés

### Quick Win 3 : Templates PDF (2 jours)
- [ ] 3 designs de devis/factures
- [ ] Sélecteur de template
- [ ] Personnalisation couleurs/logos

### Quick Win 4 : Relances Automatiques (1 jour)
- [ ] Edge function relances
- [ ] Template email relance
- [ ] Configuration délais (Settings)
- [ ] Logs envois

### Quick Win 5 : Améliorer ClientDetail (1 jour)
- [ ] Onglets (Infos, Projets, Finances, Docs)
- [ ] Timeline d'activité
- [ ] Statistiques client (CA, nb projets)

---

## 🚀 PROCHAINES ACTIONS IMMÉDIATES

### Action 1 : Choisir la priorité
**Quelle phase lancer en premier ?**

**Option A : PROJETS/CHANTIERS** (Recommandé)
- Fonctionnalité core métier
- Grande valeur ajoutée
- Dépendance pour d'autres features

**Option B : IA FOUNDATION** (Innovant)
- Différenciation concurrentielle
- Effet "wow"
- Peut être complexe

**Option C : QUICK WINS** (Pragmatique)
- Améliorations rapides
- Boost motivation
- Valeur immédiate

### Action 2 : Setup environnement IA
Si choix IA, configurer dès maintenant :
- [ ] Créer compte OpenAI
- [ ] Ajouter VITE_OPENAI_API_KEY
- [ ] Tester API basique

### Action 3 : Améliorer structure DB
- [ ] Ajouter indexes manquants
- [ ] Optimiser RLS policies
- [ ] Ajouter contraintes (foreign keys)

---

## 💡 RECOMMANDATIONS STRATÉGIQUES

### 1. Commencer par les PROJETS
Les chantiers sont le cœur métier des artisans. C'est la feature la plus attendue et celle qui apporte le plus de valeur.

### 2. Implémenter l'IA tôt
L'IA est un différenciateur majeur. Même une version basique (chatbot simple) impressionne les utilisateurs.

### 3. Itérer vite
Ne pas chercher la perfection. MVP → Test → Amélioration.

### 4. Focus UX
Privilégier une UX fluide plutôt que des features complexes.

### 5. Documentation continue
Documenter au fur et à mesure (pas à la fin).

---

## 📞 BESOIN DE CLARIFICATIONS

Avant de commencer, merci de confirmer :

1. **Quelle phase prioriser ?** (Projets / IA / Quick Wins / Autre)
2. **Avez-vous une clé API OpenAI ?** (Nécessaire pour IA)
3. **Budget Stripe ?** (Pour paiements en ligne)
4. **Besoin multi-utilisateurs prioritaire ?** (Travaillez-vous en équipe ?)
5. **Fonctionnalités spécifiques critiques ?** (À faire absolument)

---

**Prêt à démarrer ! Donnez-moi vos priorités et je commence l'implémentation. 🚀**
