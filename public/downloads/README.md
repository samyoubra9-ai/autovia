# Application bureau Autovia (Windows)

Le bouton **Télécharger** sur le site pointe vers :

- par défaut : `https://www.autovia.space/downloads/autovia-setup.exe`
- ou l’URL définie dans `NEXT_PUBLIC_BACKDASH_DESKTOP_URL` (ex. asset GitHub Releases)

## Build en ligne (recommandé)

Le build Windows se fait **sur GitHub Actions**, pas sur votre PC :

1. GitHub → **Actions** → **Backdash Desktop (Windows)** → **Run workflow**
2. À la fin, télécharger l’artifact **`autovia-setup-windows`**
3. Publier le fichier :
   - **Option A** — héberger sur le site : uploader `autovia-setup.exe` ici (Vercel, FTP, etc.)
   - **Option B** — GitHub Releases : créer une release, joindre l’exe, puis mettre l’URL dans `NEXT_PUBLIC_BACKDASH_DESKTOP_URL`

Lors d’une **Release GitHub** (`published`), le workflow attache aussi l’installateur à la release.

## Build local (optionnel)

Uniquement si vous avez assez d’espace disque (~2 Go pour Electron) :

```bash
cd backdash
npm run build:desktop
```

Sortie : `backdash/release/` — copier l’`.exe` ici sous le nom `autovia-setup.exe`.
