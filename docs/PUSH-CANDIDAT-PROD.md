# Web Push — App candidat (production)

## 1. Supabase — SQL à exécuter

Dans **Supabase → SQL Editor**, exécuter :

```sql
CREATE TABLE IF NOT EXISTS candidat_push_subscriptions (
  id          TEXT NOT NULL PRIMARY KEY,
  eleve_id    TEXT NOT NULL,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT candidat_push_subscriptions_endpoint_key UNIQUE (endpoint),
  CONSTRAINT candidat_push_subscriptions_eleve_id_fkey
    FOREIGN KEY (eleve_id)
    REFERENCES eleves(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS candidat_push_subscriptions_eleve_id_idx
  ON candidat_push_subscriptions (eleve_id);
```

Vérification :

```sql
SELECT COUNT(*) FROM candidat_push_subscriptions;
```

## 2. Clés VAPID (local puis Vercel API)

À la racine du monorepo :

```bash
npm run push:generate-vapid
```

Ajouter dans **Vercel — projet Next.js (API www.autovia.space)** :

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contact@autovia.space
```

Et dans `autoecole/.env` local (même valeurs).

## 3. Variables déjà requises

**Projet Next.js (API)** :

```env
NEXT_PUBLIC_CANDIDAT_URL=https://candidat.autovia.space
DATABASE_URL=...
DIRECT_URL=...
```

**Projet candidat (Vite)** — pas de VAPID ici :

```env
VITE_API_URL=https://www.autovia.space
```

## 4. Déploiement

1. `git push` (code API + candidat)
2. Redéployer **API** (avec VAPID_*)
3. Redéployer **candidat** (`candidat.autovia.space`)
4. Sur le PC : `npx prisma generate` (sans migrate)

## 5. Test production

1. Ouvrir **https://candidat.autovia.space** (Chrome / Edge, de préférence app installée)
2. Code de suivi → **Activer les notifications**
3. Vérifier : `https://www.autovia.space/api/v1/public/suivi/push/vapid` → `{ "enabled": true, "publicKey": "..." }`
4. Backdash : créer une séance pour cet élève → notification sur l’écran de verrouillage (app Mon permis installée)

## Événements qui envoient une push

| Action backdash | Notification |
|-----------------|--------------|
| Séance créée / modifiée / annulée / supprimée | Séance |
| Paiement enregistré | Paiement |
| Liste d'examen créée (candidat inscrit) | Convocation examen |
| Étape parcours validée | Parcours |
