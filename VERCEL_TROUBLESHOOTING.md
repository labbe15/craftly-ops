# 🔧 Dépannage Vercel - Page Blanche

## 🚨 Problème : Page Blanche sur Vercel

Si vous voyez une page blanche après le déploiement sur Vercel, suivez ces étapes :

---

## ✅ Solution Rapide (dans l'ordre)

### 1. **Vérifier les Variables d'Environnement**

Sur Vercel Dashboard → Votre Projet → Settings → Environment Variables

**Variables OBLIGATOIRES** :
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Variables OPTIONNELLES** (mais recommandées) :
```
VITE_OPENAI_API_KEY=sk-...
VITE_ENABLE_SW=false  ← Désactiver le Service Worker temporairement
```

⚠️ **IMPORTANT** : Après avoir ajouté des variables, **REDÉPLOYEZ** le projet !

---

### 2. **Vérifier les Logs d'Erreur**

1. Allez sur Vercel Dashboard → Votre Projet → **Deployments**
2. Cliquez sur le déploiement problématique
3. Allez dans l'onglet **Runtime Logs**
4. Cherchez les erreurs (rouges) ou warnings

**Erreurs courantes** :
- `Failed to load module` → Problème de build ou import
- `Uncaught ReferenceError` → Variable non définie
- `Network error` → Problème de connexion à Supabase
- `Invalid API key` → Problème OpenAI ou Supabase

---

### 3. **Désactiver le Service Worker**

Le Service Worker peut causer des problèmes de cache :

**Sur Vercel** :
1. Settings → Environment Variables
2. Ajouter : `VITE_ENABLE_SW=false`
3. Redéployer

**Localement** :
1. Ouvrir DevTools (F12)
2. Application → Service Workers
3. Cliquer "Unregister" sur tous les SW
4. Rafraîchir la page (Ctrl+Shift+R)

---

### 4. **Vider le Cache du Navigateur**

1. **Chrome/Edge** : Ctrl+Shift+Delete → Cocher "Cached images" → Clear
2. **Firefox** : Ctrl+Shift+Delete → Cocher "Cache" → Clear
3. **Safari** : Cmd+Option+E → Vider

Puis **hard refresh** :
- **Windows** : Ctrl+Shift+R
- **Mac** : Cmd+Shift+R

---

### 5. **Vérifier la Console du Navigateur**

1. Ouvrir DevTools (F12)
2. Onglet **Console**
3. Chercher les erreurs (rouges)

**Erreurs fréquentes** :

| Erreur | Solution |
|--------|----------|
| `supabaseClient is not initialized` | Vérifier `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` |
| `OpenAI API key not configured` | Ajouter `VITE_OPENAI_API_KEY` (optionnel) |
| `Failed to fetch` | Problème de CORS ou connexion Supabase |
| `Module not found` | Problème de build, vérifier les imports |

---

### 6. **Forcer un Rebuild Complet**

Sur Vercel :
1. Deployments → ⋮ (menu) → **Redeploy**
2. Cocher "**Use existing Build Cache**" → **DÉCOCHER**
3. Cliquer "Redeploy"

Cela force un build depuis zéro.

---

### 7. **Vérifier le Build Localement**

```bash
# Tester le build de production localement
npm run build

# Si succès, servir le build
npx serve dist

# Ouvrir http://localhost:3000
```

Si ça fonctionne localement mais pas sur Vercel → Problème de configuration Vercel.

---

## 🔍 Debugging Avancé

### Activer les Logs Détaillés

Créer un fichier `vercel.json` avec :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Vérifier les Redirections

Le fichier `vercel.json` à la racine **DOIT** contenir :

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Cela garantit que toutes les routes React fonctionnent.

---

## 🧪 Tests de Diagnostic

### Test 1 : Ping Supabase

```javascript
// Dans la console du navigateur
fetch('https://YOUR_PROJECT.supabase.co/rest/v1/')
  .then(r => console.log('Supabase OK:', r.status))
  .catch(e => console.error('Supabase Error:', e))
```

### Test 2 : Variables d'Environnement

```javascript
// Dans la console du navigateur (sur le site déployé)
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
```

Si `undefined` → Les variables ne sont pas configurées correctement.

---

## 🆘 Checklist Finale

Avant de demander de l'aide, vérifiez :

- [ ] Variables d'environnement ajoutées sur Vercel
- [ ] Redéployé après ajout des variables
- [ ] Service Worker désactivé (`VITE_ENABLE_SW=false`)
- [ ] Cache navigateur vidé
- [ ] Console navigateur vérifiée (pas d'erreurs rouges)
- [ ] Logs Vercel vérifiés (Runtime Logs)
- [ ] Build local fonctionne (`npm run build && npx serve dist`)
- [ ] `vercel.json` contient les rewrites

---

## 🎯 Solution la Plus Courante

**90% des cas** : Variables d'environnement manquantes

1. Vercel Dashboard → Settings → Environment Variables
2. Ajouter **au minimum** :
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   ```
3. **IMPORTANT** : Cocher les 3 environnements :
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Cliquer **Save**
5. Deployments → Latest → ⋮ → **Redeploy**

---

## 📞 Besoin d'Aide ?

Si le problème persiste :

1. **Exporter les logs** :
   - Vercel → Deployments → Runtime Logs → Copy

2. **Exporter les erreurs console** :
   - F12 → Console → Right-click → Save as...

3. **Créer une issue GitHub** avec :
   - Les logs Vercel
   - Les erreurs console
   - Les variables d'environnement (sans les valeurs secrètes !)
   - Capture d'écran de la page blanche

---

## ✅ Après la Résolution

Une fois que ça fonctionne :

1. **Réactiver le Service Worker** :
   - Supprimer `VITE_ENABLE_SW=false`
   - OU mettre `VITE_ENABLE_SW=true`
   - Redéployer

2. **Tester la PWA** :
   - Vérifier que l'icône d'installation apparaît
   - Tester le mode hors ligne

3. **Optimiser** :
   - Activer les Analytics Vercel
   - Configurer les notifications d'erreur

---

**Fait avec ❤️ pour un déploiement sans stress**
