# Hébergement Autovia

## 1. En local / sur le téléphone (Wi‑Fi)

1. `ipconfig` → IPv4 Wi‑Fi (ex. `192.168.43.157`).
2. Dans `autoecole/.env`, mettre :
   ```env
   PUBLIC_HOST=192.168.43.157
   PUBLIC_SCHEME=http
   ```
3. Lancer :
   ```bash
   npm run env:sync
   ```
4. Démarrer :
   ```bash
   npm run dev
   cd backdash && npm run dev
   ```
5. Supabase → **Authentication** → **URL Configuration** :
   - Site URL : `http://VOTRE_IP:5173`
   - Redirect URLs : `http://VOTRE_IP:5173/auth/callback`

Sur le téléphone : `http://VOTRE_IP:5173` (pas `localhost`).

---

## 2. En production (recommandé)

Quatre déploiements (même Supabase, mêmes clés) :

| App | Hébergeur | Dossier | Build |
|-----|-----------|---------|--------|
| API + landing + suivi QR | **Vercel** | racine `autoecole` | `npm run build` |
| Backdash auto-école | **Vercel** ou Netlify | `backdash/` | `npm run build` |
| App candidat PWA | **Vercel** / Netlify | `candidat/` | `npm run build` |
| Admin plateforme | **Vercel** / Netlify | `platform-admin/` | `npm run build` |

### Variables racine (Vercel — projet Next)

Copier depuis `.env` : `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, et les URLs **HTTPS** :

```env
PUBLIC_SCHEME=https
PUBLIC_APP_HOST=autovia.space
PUBLIC_BACKDASH_HOST=app.autovia.space
PUBLIC_CANDIDAT_HOST=candidat.autovia.space
PUBLIC_PLATFORM_ADMIN_HOST=admin.autovia.space
CORS_EXTRA_ORIGINS=https://www.autovia.space
```

Puis `npm run env:sync` et recopier les variables générées dans Vercel (voir `.env.example`, bloc PRODUCTION).

Résultat attendu :

```env
NEXT_PUBLIC_APP_URL=https://autovia.space
NEXT_PUBLIC_BACKDASH_URL=https://app.autovia.space
NEXT_PUBLIC_CANDIDAT_URL=https://candidat.autovia.space
NEXT_PUBLIC_PLATFORM_ADMIN_URL=https://admin.autovia.space
ALLOW_DEV_LAN_ORIGINS=false
CORS_EXTRA_ORIGINS=https://www.autovia.space
```

Landing **Connexion** / **Démarrer** / **essai gratuit** → `https://app.autovia.space/sign-in` ou `/sign-up`.

**Important (autovia.space)** : si le domaine racine redirige vers `www` (307 Vercel), l’API doit être appelée en **`https://www.autovia.space`** — pas `https://autovia.space` seul, sinon le backdash affiche « Impossible de contacter le serveur » (CORS + redirect).

### Variables backdash / candidat / platform-admin (projets Vite séparés)

Mêmes clés Supabase + (généré par `env:sync`) :

```env
VITE_APP_URL=https://www.autovia.space
VITE_API_URL=https://www.autovia.space
VITE_BACKDASH_URL=https://app.autovia.space
VITE_CANDIDAT_URL=https://candidat.autovia.space
VITE_PLATFORM_ADMIN_URL=https://admin.autovia.space
VITE_PLATFORM_URL=https://autovia.space
```

### Supabase prod (OAuth Google)

Dans **Authentication → URL Configuration** :

| Champ | Valeur |
|-------|--------|
| **Site URL** | `https://app.autovia.space` |
| **Redirect URLs** | `https://app.autovia.space/**` |
| | `https://admin.autovia.space/**` |
| | `https://www.autovia.space/**` (landing Next) |

Si **Site URL** reste sur `http://localhost:5173`, Google renverra toujours vers localhost même depuis `app.autovia.space`.

Sur Vercel (projet **backdash**), définir au minimum :

```env
VITE_BACKDASH_URL=https://app.autovia.space
VITE_API_URL=https://www.autovia.space
```

Puis redéployer le backdash.

### Après deploy

```bash
npx prisma migrate deploy
```

(avec `DATABASE_URL` / `DIRECT_URL` en variable d’environnement CI ou en local)

---

## 3. Commandes utiles

```bash
npm run env:sync      # propage PUBLIC_HOST vers tous les .env
npm run build:all     # vérifie que tout compile avant deploy
```
