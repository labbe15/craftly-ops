# Craftly Ops - CRM pour Artisans

CRM complet pour artisans permettant la gestion de clients, devis, factures et agenda.

## 🚀 Fonctionnalités

- **Gestion des clients** : Créer, modifier, supprimer et visualiser vos clients
- **Catalogue d'articles** : Gérer vos prestations et articles avec prix HT et TVA
- **Devis** : Créer et suivre vos devis
- **Factures** : Générer et gérer vos factures
- **Agenda** : Planifier vos rendez-vous et interventions
- **Dashboard** : Vue d'ensemble de votre activité
- **Multi-tenant** : Isolation des données par organisation

## 🛠️ Stack Technique

- **Frontend** : React 18 + TypeScript + Vite
- **UI** : shadcn/ui + Tailwind CSS + Radix UI
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **State Management** : TanStack Query (React Query)
- **Forms** : React Hook Form + Zod
- **Routing** : React Router v6
- **Icons** : Lucide React

## 📋 Prérequis

- Node.js 18+ et npm
- Un compte Supabase (gratuit sur [supabase.com](https://supabase.com))

## 🔧 Installation

### 1. Cloner le repository

```bash
git clone <votre-repo-url>
cd craftly-ops
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Supabase

#### 3.1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet
3. Notez votre **URL du projet** et votre **clé publique (anon key)**

#### 3.2. Appliquer les migrations

Dans le dashboard Supabase, allez dans **SQL Editor** et exécutez les fichiers de migration dans l'ordre :

1. `supabase/migrations/20251016175106_0e793ceb-aa21-4352-ac4d-c936084ce81c.sql`
2. `supabase/migrations/20251021000000_fix_multi_tenant.sql`

Ces migrations créent :
- Les tables (clients, items, quotes, invoices, etc.)
- Les politiques RLS pour la sécurité multi-tenant
- Le système d'auto-provisioning des organisations

#### 3.3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditez `.env` et ajoutez vos credentials Supabase :

```env
VITE_SUPABASE_URL=https://votre-projet-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre-cle-publique
VITE_SUPABASE_PROJECT_ID=votre-projet-id
```

### 4. Lancer l'application en développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:8080`

## 🏗️ Build pour la production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`

## 🚀 Déploiement

### Option 1 : Vercel

1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
3. Déployez !

### Option 2 : Netlify

1. Connectez votre repository GitHub à Netlify
2. Build command : `npm run build`
3. Publish directory : `dist`
4. Configurez les variables d'environnement
5. Déployez !

### Option 3 : Serveur VPS (avec Nginx)

```bash
# Build l'application
npm run build

# Copiez le contenu de dist/ sur votre serveur
scp -r dist/* user@votre-serveur:/var/www/craftly-ops/

# Configuration Nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/craftly-ops;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 📁 Structure du Projet

```
craftly-ops/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── layout/      # Layout (AppLayout, Sidebar, TopBar)
│   │   └── ui/          # Composants UI (shadcn/ui)
│   ├── hooks/           # Hooks personnalisés
│   │   └── useOrgId.ts  # Hook pour gérer l'organisation
│   ├── integrations/    # Intégrations externes
│   │   └── supabase/    # Client et types Supabase
│   ├── lib/             # Utilitaires
│   ├── pages/           # Pages de l'application
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Clients.tsx
│   │   ├── ClientForm.tsx
│   │   ├── Items.tsx
│   │   ├── ItemForm.tsx
│   │   ├── Quotes.tsx
│   │   ├── Invoices.tsx
│   │   └── ...
│   ├── App.tsx          # Composant racine avec routing
│   └── main.tsx         # Point d'entrée
├── supabase/
│   └── migrations/      # Migrations SQL
├── .env.example         # Template des variables d'environnement
└── package.json
```

## 🔒 Sécurité

Le projet utilise Row Level Security (RLS) de Supabase pour garantir :
- **Isolation des données** : Chaque organisation voit uniquement ses propres données
- **Authentification** : Seuls les utilisateurs authentifiés peuvent accéder aux données
- **Auto-provisioning** : Chaque nouvel utilisateur obtient automatiquement sa propre organisation

## 🧪 Tests

```bash
# Linter
npm run lint

# Build de test
npm run build
```

## 📝 Développement

### Ajouter une nouvelle page

1. Créez le composant dans `src/pages/`
2. Ajoutez la route dans `src/App.tsx`
3. Ajoutez le lien dans `src/components/layout/AppSidebar.tsx`

### Ajouter une nouvelle table Supabase

1. Créez une migration SQL dans `supabase/migrations/`
2. Ajoutez les types dans `src/integrations/supabase/types.ts`
3. Créez les composants de formulaire et liste

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 License

MIT

## 🆘 Support

Pour toute question ou problème :
1. Vérifiez que les migrations Supabase sont bien appliquées
2. Vérifiez que les variables d'environnement sont correctement configurées
3. Consultez les logs de la console navigateur
4. Ouvrez une issue sur GitHub

## 🎯 Roadmap

- [ ] Génération de PDF pour devis et factures
- [ ] Envoi d'emails automatiques
- [ ] Gestion des paiements
- [ ] Statistiques avancées
- [ ] Mode multi-utilisateur par organisation
- [ ] Application mobile (React Native)
- [ ] Export des données (CSV, Excel)
- [ ] Intégration comptabilité

---

Développé avec ❤️ pour les artisans
