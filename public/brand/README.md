# Logo & favicon Autovia

## Dossier source (ne pas déplacer)

Placez le pack généré (RealFaviconGenerator, etc.) dans :

```
public/brand/favicon/
  favicon.svg
  favicon.ico
  favicon-96x96.png
  apple-touch-icon.png
  web-app-manifest-192x192.png
  web-app-manifest-512x512.png
  site.webmanifest          ← mis à jour pour Autovia
```

## Synchroniser vers toutes les apps

À la racine du projet :

```bash
npm run brand:sync
```

Cela copie les icônes vers **backdash**, **candidat** et **platform-admin**.

Puis redémarrez les serveurs (`npm run dev`, etc.) et faites **Ctrl+F5** dans le navigateur.

## Où c’est utilisé

| App | Favicon / PWA |
|-----|----------------|
| **Next.js** (landing) | `app/layout.tsx` → `/brand/favicon/*` + logo header |
| **Backdash** | `backdash/public/images/` |
| **Candidat** | `candidat/public/icon.svg` + `icons/*.png` |
| **Platform-admin** | `platform-admin/public/icon.svg` + PNG |

Après changement de logo : remplacez les fichiers dans `public/brand/favicon/`, relancez `npm run brand:sync`.
