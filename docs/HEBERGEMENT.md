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
PUBLIC_HOST=app.votredomaine.dz
PUBLIC_SCHEME=https
```

Puis localement `npm run env:sync` et recopier les `NEXT_PUBLIC_*` générés dans le dashboard Vercel.

Ou saisir à la main :

```env
NEXT_PUBLIC_APP_URL=https://app.votredomaine.dz
NEXT_PUBLIC_BACKDASH_URL=https://admin.votredomaine.dz
NEXT_PUBLIC_CANDIDAT_URL=https://candidat.votredomaine.dz
NEXT_PUBLIC_PLATFORM_ADMIN_URL=https://superadmin.votredomaine.dz
ALLOW_DEV_LAN_ORIGINS=false
CORS_EXTRA_ORIGINS=
```

### Variables backdash / candidat / platform-admin (projets Vite séparés)

Mêmes clés Supabase + :

```env
VITE_APP_URL=https://app.votredomaine.dz
VITE_API_URL=https://app.votredomaine.dz
VITE_BACKDASH_URL=https://admin.votredomaine.dz
VITE_CANDIDAT_URL=https://candidat.votredomaine.dz
VITE_PLATFORM_ADMIN_URL=https://superadmin.votredomaine.dz
VITE_PLATFORM_URL=https://app.votredomaine.dz
```

### Supabase prod

- Site URL = URL du **backdash**
- Redirect URLs = `https://admin…/auth/callback` et `https://superadmin…/auth/callback`
- Ajouter toutes les URLs dans **Redirect URLs**

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
