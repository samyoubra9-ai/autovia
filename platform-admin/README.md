# DriveSaaS — Admin plateforme

Application React **séparée** du backdash (SaaS auto-école). Réservée aux comptes `site_admin`.

## Prérequis

- API Next.js (`autoecole`) sur le port 3000
- Même projet Supabase que backdash

## Configuration

```bash
cp .env.example .env
```

Dans Supabase Auth → **Redirect URLs**, ajouter :

- `http://localhost:5175/auth/callback`
- URL de production de cette app

Dans `.env` à la racine `autoecole`, ajouter :

```env
NEXT_PUBLIC_PLATFORM_ADMIN_URL="http://localhost:5175"
```

## Lancer

```bash
cp .env.example .env
# ou copier les VITE_* depuis backdash/.env
npm install
npm run dev
```

Ouvre [http://localhost:5175](http://localhost:5175).

## Fonctionnalités

- **Dark mode** : bouton soleil/lune (clair, sombre, système)
- **Notifications** : essai ou abonnement qui se termine dans **2 jours**, nouveaux clients, comptes en attente — cloche en haut à droite + page `/notifications`
- **Pages** : tableau de bord `/`, liste `/clients`, création `/clients/new`

### Écran blanc ?

1. Vérifiez que **platform-admin/.env** existe (mêmes clés Supabase que backdash).
2. Si vous aviez déjà lancé l’app : DevTools → Application → Service Workers → **Unregister**, puis Ctrl+F5.
3. Next.js doit tourner sur le port **3000** pour l’API.

## PWA

Build production : `npm run build` puis `npm run preview`. Le service worker s’enregistre en prod.
