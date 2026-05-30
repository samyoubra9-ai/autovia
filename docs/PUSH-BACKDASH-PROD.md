# Web Push — Backdash (production)

Mêmes clés **VAPID** que le candidat (projet API Next.js racine).

## SQL Supabase

Exécuter `docs/sql/backdash-push-subscriptions.sql`.

## Variables Vercel (API)

Déjà en place si le candidat push fonctionne :

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

## Déploiement

1. API Next.js (routes `/api/v1/push/*`)
2. Backdash PWA (fichier `public/push-handler.js` + `vite.config` importScripts)

## Test

1. Connexion backdash → accepter la bannière « Activer les notifications » (ou via la cloche → Activer).
2. Créer une séance depuis un autre appareil / compte : popup sur l’appareil abonné.
3. Cloche in-app : alertes locales ; push : alertes serveur (app fermée possible).
