# Guide de Déploiement Autonome - Craftly Ops

Ce guide vous accompagne pas à pas pour déployer Craftly Ops avec vos propres services, sans dépendance à Lovable ou autres plateformes.

## 📋 Prérequis

- Compte GitHub (pour héberger le code)
- Compte Supabase (gratuit)
- Compte sur une plateforme de déploiement (Vercel, Netlify, ou VPS)

## 🔐 Étape 1 : Configuration de Supabase

### 1.1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur "Start your project"
3. Connectez-vous ou créez un compte
4. Cliquez sur "New Project"
5. Remplissez les informations :
   - **Name** : craftly-ops (ou autre nom)
   - **Database Password** : Générez un mot de passe fort et sauvegardez-le
   - **Region** : Choisissez la région la plus proche de vos utilisateurs
   - **Pricing Plan** : Free (suffisant pour commencer)

### 1.2. Récupérer les credentials

Une fois le projet créé (environ 2 minutes) :

1. Allez dans **Settings** > **API**
2. Notez ces 3 valeurs :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public** key : `eyJhbGc...` (longue clé)
   - **Project Reference ID** : `xxxxx`

### 1.3. Appliquer les migrations de base de données

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Cliquez sur "New query"
3. Copiez-collez le contenu de `supabase/migrations/20251016175106_0e793ceb-aa21-4352-ac4d-c936084ce81c.sql`
4. Cliquez sur "Run"
5. Répétez pour `supabase/migrations/20251021000000_fix_multi_tenant.sql`

✅ Vous devriez voir "Success" pour chaque migration.

### 1.4. Vérifier les tables

1. Allez dans **Table Editor**
2. Vous devriez voir les tables suivantes :
   - `clients`
   - `items`
   - `quotes`
   - `invoices`
   - `events`
   - `org_settings`
   - `user_organizations`
   - Et autres...

## 🔧 Étape 2 : Configuration Locale

### 2.1. Cloner le projet

```bash
git clone <votre-repo-url>
cd craftly-ops
```

### 2.2. Installer les dépendances

```bash
npm install
```

### 2.3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditez `.env` avec les valeurs de Supabase :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=xxxxx
```

### 2.4. Tester localement

```bash
npm run dev
```

Ouvrez `http://localhost:8080` et créez un compte pour tester.

## 🚀 Étape 3 : Déploiement

### Option A : Déploiement sur Vercel (Recommandé)

#### 3.1. Préparer le repository GitHub

Si ce n'est pas déjà fait :

```bash
git add .
git commit -m "Configuration autonome Craftly Ops"
git push origin main
```

#### 3.2. Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub
3. Cliquez sur "Add New" > "Project"
4. Importez votre repository `craftly-ops`
5. Configurez les variables d'environnement :
   - Cliquez sur "Environment Variables"
   - Ajoutez :
     ```
     VITE_SUPABASE_URL = https://xxxxx.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGc...
     VITE_SUPABASE_PROJECT_ID = xxxxx
     ```
6. Cliquez sur "Deploy"

⏱️ Le déploiement prend environ 2-3 minutes.

#### 3.3. Configurer un domaine personnalisé (optionnel)

1. Dans Vercel, allez dans **Settings** > **Domains**
2. Ajoutez votre domaine
3. Configurez vos DNS selon les instructions Vercel

### Option B : Déploiement sur Netlify

#### 3.1. Créer un site Netlify

1. Allez sur [netlify.com](https://netlify.com)
2. Connectez-vous avec GitHub
3. Cliquez sur "Add new site" > "Import an existing project"
4. Sélectionnez votre repository
5. Configuration du build :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`

#### 3.2. Variables d'environnement

1. Allez dans **Site settings** > **Environment variables**
2. Ajoutez :
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGc...
   VITE_SUPABASE_PROJECT_ID = xxxxx
   ```

#### 3.3. Déployer

Cliquez sur "Deploy site"

### Option C : Déploiement sur VPS (DigitalOcean, AWS, etc.)

#### 3.1. Préparer le serveur

```bash
# Connectez-vous à votre VPS
ssh user@votre-serveur-ip

# Installez Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installez Nginx
sudo apt-get install nginx
```

#### 3.2. Cloner et builder le projet

```bash
# Clonez le projet
git clone <votre-repo-url> /var/www/craftly-ops
cd /var/www/craftly-ops

# Installez les dépendances
npm install

# Créez le fichier .env avec vos variables
nano .env
# Ajoutez vos variables Supabase

# Build l'application
npm run build
```

#### 3.3. Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/craftly-ops
```

Collez cette configuration :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    root /var/www/craftly-ops/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache des assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Activez le site :

```bash
sudo ln -s /etc/nginx/sites-available/craftly-ops /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3.4. HTTPS avec Let's Encrypt (recommandé)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

## 🔄 Mise à jour de l'application

### Sur Vercel/Netlify

Simplement pusher sur votre branche :

```bash
git add .
git commit -m "Mise à jour"
git push origin main
```

Le déploiement se fera automatiquement.

### Sur VPS

```bash
cd /var/www/craftly-ops
git pull origin main
npm install
npm run build
```

## 📊 Monitoring et Logs

### Supabase

1. Dashboard Supabase > **Database** > **Logs**
2. Consultez les erreurs de requêtes SQL

### Vercel

1. Dashboard Vercel > Votre projet > **Deployments**
2. Cliquez sur un déploiement pour voir les logs

### Netlify

1. Dashboard Netlify > Votre site > **Deploys**
2. Cliquez sur un déploiement pour voir les logs

### VPS

```bash
# Logs Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 🔒 Sécurité et Bonnes Pratiques

### 1. Variables d'environnement

❌ **Ne jamais commit .env dans Git**

✅ Toujours utiliser .env.example comme template

### 2. RLS Supabase

Les policies sont déjà configurées, mais vérifiez régulièrement dans :
- Dashboard Supabase > **Authentication** > **Policies**

### 3. Sauvegardes

Dans Supabase, activez les sauvegardes automatiques :
- Dashboard > **Settings** > **Database** > **Backups**

### 4. Limites de rate

Configurez les limites dans Supabase :
- Dashboard > **Authentication** > **Rate Limits**

## 🆘 Dépannage

### Erreur "Invalid API key"

- Vérifiez que les variables d'environnement sont correctes
- Redéployez après modification des variables

### Erreur "relation does not exist"

- Les migrations n'ont pas été appliquées
- Exécutez les migrations SQL dans Supabase

### Page blanche après déploiement

- Vérifiez les logs de la console navigateur (F12)
- Vérifiez que les variables d'environnement sont présentes

### Problème d'authentification

- Vérifiez dans Supabase > **Authentication** > **URL Configuration**
- Ajoutez votre domaine de production dans "Site URL" et "Redirect URLs"

## 📞 Support

Pour toute question :
1. Consultez la documentation Supabase
2. Vérifiez les logs
3. Ouvrez une issue GitHub
4. Consultez les forums communautaires

---

✨ Votre application est maintenant 100% autonome et sous votre contrôle !
