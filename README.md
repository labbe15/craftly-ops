# 🛠️ Craftly Ops - CRM/ERP pour Artisans

**CRM et ERP tout-en-un conçu spécifiquement pour les artisans.**
Gérez vos clients, projets, devis, factures, et bien plus avec une interface moderne et des outils d'IA avancés.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## ✨ Fonctionnalités Principales

### 📊 Gestion Complète

- **Dashboard Analytics** - KPIs en temps réel, graphiques de chiffre d'affaires, taux de conversion
- **Gestion Clients** - Fiches complètes avec historique, notes, coordonnées GPS
- **Projets & Chantiers** - Kanban board, suivi d'avancement, gestion d'équipe
- **Devis & Factures** - Génération PDF avec templates multiples (Modern, Classic, Minimal)
- **Articles & Catalogue** - Produits et services avec prix, descriptions, TVA
- **Relances Automatiques** - Système de rappels intelligents pour paiements

### 🤖 Intelligence Artificielle

- **Chatbot IA** (⌘K) - Assistant conversationnel pour rechercher, créer, analyser
- **Vision AI** - Analyse de photos de chantier pour :
  - Estimation de l'avancement des travaux
  - Détection de défauts et malfaçons
  - Identification de matériaux
  - Vérification de sécurité
- **OCR Intelligent** - Extraction de données depuis :
  - Factures fournisseurs
  - Reçus de dépenses
  - Devis externes
- **Génération de Contenu** - Emails, descriptions de projets, analyses

### ⚡ Automatisation

- **Workflow Builder** - Créez des automatisations no-code :
  - Déclencheurs : changement de statut, nouveau client, planification
  - Actions : envoi d'email, création de tâche, notification, mise à jour
  - Conditions et logique personnalisée
- **Templates d'Automatisation** - Scénarios pré-configurés
- **Historique d'Exécution** - Logs et monitoring des workflows

### 📱 Progressive Web App (PWA)

- **Installation** - Utilisez comme une app native sur mobile et desktop
- **Mode Hors Ligne** - Navigation et consultation des données en cache
- **Notifications Push** - Alertes en temps réel
- **Background Sync** - Synchronisation automatique des données

### 👥 Multi-Utilisateurs & RBAC

- **3 Rôles** :
  - **Admin** - Accès complet, gestion équipe et paramètres
  - **Manager** - Gestion projets, devis, factures
  - **User** - Consultation et saisie limitée
- **Permissions Granulaires** - Contrôle d'accès par fonctionnalité
- **Gestion d'Équipe** - Invitations, avatars, profils

### 🎨 Interface Moderne

- **Design System** - Basé sur Shadcn/UI et Radix UI
- **Thème Professionnel** - Interface épurée et intuitive
- **Responsive** - Optimisé mobile, tablette, desktop
- **Recherche Globale** (⌘K) - Accès rapide à toutes les données
- **Dark Mode** - Confort visuel (à venir)

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** 18+ et npm 9+
- Compte **Supabase** (gratuit)
- Clé API **OpenAI** (pour l'IA)

### Installation

```bash
# Cloner le repository
git clone https://github.com/VOTRE_USERNAME/craftly-ops.git
cd craftly-ops

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# Lancer en développement
npm run dev
```

L'application sera disponible sur **http://localhost:5173**

### Configuration Minimale

Créez `.env.local` avec :

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
```

📖 **[Guide de Déploiement Complet](./DEPLOYMENT.md)**

---

## 🗄️ Structure de la Base de Données

### Tables Principales

- **clients** - Informations clients (particuliers et entreprises)
- **contacts** - Contacts multiples par client entreprise
- **projects** - Projets/chantiers avec suivi complet
- **quotes** - Devis avec lignes et totaux
- **invoices** - Factures avec paiements
- **items** - Catalogue produits et services
- **suppliers** - Fournisseurs
- **categories** - Organisation hiérarchique
- **documents** - Fichiers liés (contrats, photos, plans)
- **time_entries** - Pointages de temps
- **expenses** - Dépenses avec reçus
- **workflows** - Automatisations configurables
- **ai_conversations** - Historique chatbot
- **user_profiles** - Profils utilisateurs et RBAC
- **notifications** - Système de notifications

### Migrations

Toutes les migrations SQL sont dans `supabase/migrations/` :

```bash
supabase db push
```

📄 **[Documentation DB Complète](./supabase/migrations/DATABASE_STRUCTURE.md)**

---

## 📦 Technologies Utilisées

### Frontend

- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool ultra-rapide
- **TailwindCSS** - Styling utilitaire
- **Shadcn/UI** - Composants accessibles
- **Radix UI** - Primitives headless
- **React Query** - Gestion d'état serveur
- **Zustand** - State management client
- **React Hook Form + Zod** - Validation de formulaires
- **Recharts** - Graphiques et analytics
- **date-fns** - Manipulation de dates

### Backend & Services

- **Supabase** - Base de données PostgreSQL + Auth + Storage + RLS
- **OpenAI GPT-4** - Chatbot et génération
- **OpenAI Vision** - Analyse d'images et OCR
- **Service Workers** - PWA et offline

### PDF & Documents

- **jsPDF** - Génération PDF côté client
- **Templates Multiples** - 3 designs (Modern, Classic, Minimal)

---

## 📂 Structure du Projet

```
craftly-ops/
├── public/
│   ├── manifest.json          # Config PWA
│   ├── sw.js                  # Service Worker
│   ├── icon.svg               # Icône de l'app
│   ├── generate-icons.html    # Outil génération PNG
│   └── offline.html           # Page hors ligne
├── src/
│   ├── components/
│   │   ├── layout/            # AppSidebar, Header
│   │   ├── ui/                # Composants Shadcn
│   │   ├── pdf/               # Génération PDF
│   │   └── chat/              # Chatbot IA
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Clients.tsx
│   │   ├── Projects.tsx
│   │   ├── Quotes.tsx
│   │   ├── Invoices.tsx
│   │   ├── Workflows.tsx
│   │   ├── Analytics.tsx
│   │   ├── Team.tsx
│   │   └── ...
│   ├── services/
│   │   ├── supabase.ts        # Client Supabase
│   │   ├── openai.service.ts  # Service OpenAI
│   │   └── workflow.service.ts # Engine workflows
│   ├── pwa/
│   │   └── registerSW.ts      # Enregistrement SW
│   └── lib/
│       └── utils.ts           # Utilitaires
├── supabase/
│   └── migrations/            # Migrations SQL
├── DEPLOYMENT.md              # Guide de déploiement
└── README.md
```

---

## 🎯 Roadmap

### ✅ Complété (v1.0)

- [x] Gestion clients, projets, devis, factures
- [x] Templates PDF multiples
- [x] Système de relances automatiques
- [x] Chatbot IA avec GPT-4
- [x] Vision AI et OCR
- [x] Workflow Builder no-code
- [x] Analytics avancées
- [x] PWA et mode offline
- [x] Multi-utilisateurs et RBAC
- [x] Recherche globale (⌘K)
- [x] Système de tags universel

### 🚧 Prochaines Étapes (v1.1)

- [ ] Dark Mode
- [ ] Notifications email (SendGrid/Resend)
- [ ] Export Excel/CSV complet
- [ ] Calendrier partagé avec Google Calendar
- [ ] Signature électronique de documents
- [ ] Génération de contrats automatique
- [ ] Tableau de bord mobile natif
- [ ] Intégration Stripe pour paiements en ligne
- [ ] Import/Export de données
- [ ] API publique pour intégrations

### 🔮 Future (v2.0)

- [ ] Application mobile (React Native)
- [ ] Planning automatique avec IA
- [ ] Devis interactifs pour clients
- [ ] Portail client dédié
- [ ] Intégration comptabilité
- [ ] Market place de templates
- [ ] Multi-langues (EN, ES, DE)

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. **Fork** le projet
2. **Créez** une branche (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Pushez** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

### Standards de Code

- **TypeScript** strict mode
- **ESLint** + **Prettier** configurés
- **Commits conventionnels** (feat, fix, docs, etc.)

---

## 📄 License

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🆘 Support

- **Issues** : [GitHub Issues](https://github.com/VOTRE_USERNAME/craftly-ops/issues)
- **Documentation** : [Wiki du projet](https://github.com/VOTRE_USERNAME/craftly-ops/wiki)
- **Email** : support@craftly-ops.fr

---

## 🙏 Remerciements

- **Shadcn** pour le magnifique design system
- **Supabase** pour le backend as a service
- **OpenAI** pour les capacités d'IA
- La communauté **React** et **TypeScript**

---

**Fait avec ❤️ pour les artisans par des développeurs passionnés**

---

## 📸 Screenshots

### Dashboard Analytics
![Dashboard](docs/screenshots/dashboard.png)

### Gestion de Projets (Kanban)
![Projects](docs/screenshots/projects.png)

### Chatbot IA
![AI Chat](docs/screenshots/chat.png)

### Workflow Builder
![Workflows](docs/screenshots/workflows.png)

_Screenshots à venir..._
