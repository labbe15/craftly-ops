# 🚀 Guide de Déploiement - Craftly Ops

Guide complet pour déployer et configurer votre CRM/ERP Craftly Ops.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration Supabase](#configuration-supabase)
3. [Configuration OpenAI](#configuration-openai)
4. [Installation Locale](#installation-locale)
5. [Génération des Icônes PWA](#génération-des-icônes-pwa)
6. [Déploiement Production](#déploiement-production)
7. [Configuration Email](#configuration-email)
8. [Vérifications Post-Déploiement](#vérifications-post-déploiement)

---

## 🔧 Prérequis

- **Node.js** 18+ et npm 9+
- Compte **Supabase** (gratuit : https://supabase.com)
- Compte **OpenAI** avec clé API (https://platform.openai.com)
- **Git** installé

## 🗄️ Configuration Supabase

### 1. Créer un Projet Supabase

1. Allez sur https://app.supabase.com
2. Cliquez sur "New Project"
3. Remplissez :
   - **Name** : Craftly Ops
   - **Database Password** : (générez-en un fort)
   - **Region** : choisissez le plus proche de vos utilisateurs

### 2. Exécuter les Migrations

Une fois le projet créé :

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier votre projet (remplacez avec votre Project ID)
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer toutes les migrations
supabase db push
```

**OU** manuellement depuis l'interface Supabase :

1. Allez dans **SQL Editor**
2. Copiez le contenu de chaque fichier `.sql` dans `supabase/migrations/`
3. Exécutez-les dans l'ordre chronologique

### 3. Récupérer les Clés API

Dans votre projet Supabase :
1. Allez dans **Settings** → **API**
2. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 🤖 Configuration OpenAI

### 1. Obtenir une Clé API

1. Allez sur https://platform.openai.com/api-keys
2. Cliquez sur **Create new secret key**
3. Nommez-la "Craftly Ops"
4. Copiez la clé (elle ne sera affichée qu'une fois !)

### 2. Modèles Recommandés

L'application utilise par défaut :
- **gpt-4** pour le chatbot et génération de contenu
- **gpt-4-vision-preview** pour l'analyse de photos et OCR

**Budget recommandé** : 20-50€/mois pour un usage moyen

## 💻 Installation Locale

### 1. Cloner et Installer

```bash
# Cloner le repository
git clone https://github.com/VOTRE_USERNAME/craftly-ops.git
cd craftly-ops

# Installer les dépendances
npm install
```

### 2. Configurer les Variables d'Environnement

Créez un fichier `.env.local` à la racine :

```env
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# OpenAI
VITE_OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY

# App Config
VITE_APP_NAME="Craftly Ops"
VITE_APP_URL=http://localhost:5173
```

### 3. Lancer en Dev

```bash
npm run dev
```

L'application sera disponible sur **http://localhost:5173**

## 🎨 Génération des Icônes PWA

Les icônes PNG pour la PWA doivent être générées :

### Méthode 1 : Outil HTML Automatique

1. Démarrez l'application en dev : `npm run dev`
2. Ouvrez http://localhost:5173/generate-icons.html
3. Cliquez sur **"Générer les icônes"**
4. Les fichiers `icon-192.png` et `icon-512.png` seront téléchargés
5. Placez-les dans le dossier `public/`

### Méthode 2 : Manuellement avec un Éditeur

1. Ouvrez `public/icon.svg` dans Figma/Illustrator/Inkscape
2. Exportez en PNG :
   - **192x192 px** → `icon-192.png`
   - **512x512 px** → `icon-512.png`
3. Placez les fichiers dans `public/`

## 🌐 Déploiement Production

### Option 1 : Vercel (Recommandé)

1. **Installer Vercel CLI** :
   ```bash
   npm install -g vercel
   ```

2. **Déployer** :
   ```bash
   vercel
   ```

3. **Configurer les Variables** :
   - Allez dans votre projet Vercel → Settings → Environment Variables
   - Ajoutez toutes les variables du `.env.local`

4. **Redéployer** :
   ```bash
   vercel --prod
   ```

### Option 2 : Netlify

1. **Installer Netlify CLI** :
   ```bash
   npm install -g netlify-cli
   ```

2. **Build** :
   ```bash
   npm run build
   ```

3. **Déployer** :
   ```bash
   netlify deploy --prod
   ```

4. **Variables d'environnement** :
   - Site Settings → Environment Variables
   - Ajoutez toutes vos variables

### Option 3 : Auto-Hébergement (VPS)

```bash
# Build de production
npm run build

# Les fichiers sont dans dist/
# Servez-les avec nginx, Apache ou autre serveur web

# Exemple nginx config
server {
  listen 80;
  server_name craftly-ops.votre-domaine.com;

  root /var/www/craftly-ops/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## 📧 Configuration Email

Pour les relances automatiques et l'envoi de devis/factures :

### Option 1 : Supabase Auth (Gratuit, limité)

Configuré par défaut, limité à 4 emails/heure en gratuit.

### Option 2 : SendGrid

1. Créez un compte sur https://sendgrid.com
2. Obtenez une clé API
3. Ajoutez à votre `.env.local` :
   ```env
   VITE_SENDGRID_API_KEY=SG.YOUR_KEY
   VITE_FROM_EMAIL=noreply@votre-domaine.com
   ```

### Option 3 : Resend (Recommandé)

1. Compte sur https://resend.com (100 emails/jour gratuit)
2. Obtenez votre clé API
3. Configuration :
   ```env
   VITE_RESEND_API_KEY=re_YOUR_KEY
   VITE_FROM_EMAIL=hello@votre-domaine.com
   ```

## ✅ Vérifications Post-Déploiement

### Checklist de Vérification

- [ ] **Connexion Supabase** : Testez la création d'un compte
- [ ] **Authentification** : Login/Logout fonctionne
- [ ] **Création de Client** : Ajoutez un client test
- [ ] **Création de Devis** : Créez un devis avec PDF
- [ ] **Chatbot IA** : Testez une question (⌘K)
- [ ] **PWA** : Vérifiez l'installabilité (icône dans la barre d'adresse)
- [ ] **Mode Hors Ligne** : Coupez internet, naviguez dans l'app
- [ ] **Workflows** : Créez un workflow simple
- [ ] **Analytics** : Vérifiez les graphiques avec des données

### Tests de Performance

```bash
# Build de production
npm run build

# Vérifier la taille du bundle
ls -lh dist/assets/

# Target : < 1 MB pour le JS principal
```

### Monitoring Recommandé

- **Sentry** pour les erreurs : https://sentry.io
- **Google Analytics** pour l'usage : ajoutez votre ID dans `index.html`
- **Supabase Dashboard** pour la base de données

## 🔐 Sécurité

### Recommandations

1. **Row Level Security** : Déjà configuré dans les migrations
2. **HTTPS** : Obligatoire en production (Vercel/Netlify le font automatiquement)
3. **Variables** : Ne jamais commit `.env.local` (déjà dans `.gitignore`)
4. **API Keys** : Rotation régulière tous les 3-6 mois
5. **Backup DB** : Activez les backups Supabase automatiques

### Activation RBAC

Les rôles sont définis (`admin`, `manager`, `user`) mais les permissions doivent être implémentées côté Supabase :

```sql
-- Exemple : seuls les admins peuvent supprimer des clients
CREATE POLICY "Only admins can delete clients"
ON public.clients FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

## 📱 PWA : Installation sur Mobile

### iOS (Safari)

1. Ouvrez l'app dans Safari
2. Tapez l'icône **Partager** (carré avec flèche)
3. **Ajouter à l'écran d'accueil**
4. L'app s'installe comme une app native !

### Android (Chrome)

1. Ouvrez l'app dans Chrome
2. Un banner "Installer l'application" apparaît
3. Tapez **Installer**
4. L'app se lance en mode standalone

## 🆘 Dépannage

### Erreur : "Supabase client not initialized"

→ Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien définis

### Erreur : "OpenAI API key not configured"

→ Ajoutez `VITE_OPENAI_API_KEY` à votre `.env.local`

### Les icônes PWA ne s'affichent pas

→ Générez les PNG avec `generate-icons.html` et placez-les dans `public/`

### Le Service Worker ne se met pas à jour

→ Ouvrez DevTools → Application → Service Workers → Unregister

### Erreur 403 sur Supabase

→ Vérifiez les RLS policies et que l'utilisateur est authentifié

## 📞 Support

- **Issues** : https://github.com/VOTRE_USERNAME/craftly-ops/issues
- **Docs Supabase** : https://supabase.com/docs
- **Docs OpenAI** : https://platform.openai.com/docs

---

**🎉 Félicitations !** Votre CRM Craftly Ops est maintenant déployé et prêt à l'emploi.
