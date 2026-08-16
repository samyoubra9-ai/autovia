# Captures d'écran — landing Autovia

Déposez vos **vraies captures** (PNG ou WebP) dans ce dossier.  
Le site les affiche automatiquement dès que le fichier existe avec le bon nom.

## Fichiers à fournir

| Fichier | Où sur le site | Écran à capturer (backdash / candidat) |
|---------|----------------|----------------------------------------|
| **`headimage.png`** | Hero (accueil, en haut) | Tableau de bord — `https://app.autovia.space/` |
| **`espaceauto.png`** | Carte produit « Autovia » | Même tableau de bord ou vue d’ensemble claire |
| **`planning.png`** | « Plannings de conduite intelligents » | Planning séances — `https://app.autovia.space/seances/` |
| **`tresorerie.png`** | « Candidats & trésorerie centralisés » | Liste élèves — `/eleves/` ou paiements — `/paiements/` |
| **`impression.png`** | « Listes d'examen prêtes à imprimer » | Listes d'examen — `/listes-examen/` ou aperçu impression |
| **`pwa.png`** | Carte « Portail candidat » | App candidat sur mobile (format vertical) |

## Comment faire une bonne capture

1. Connectez-vous sur **app.autovia.space** (données de démo propres si possible).
2. **Masquez** les infos sensibles (noms réels, téléphones) ou utilisez un compte démo.
3. Fenêtre navigateur **~1400 px** de large (pas plein écran 4K).
4. **Win + Shift + S** (Windows) ou outil capture → enregistrez en PNG.
5. Recadrez si besoin (ratio proche de **1200×750** pour le desktop, **390×844** pour le mobile).
6. Renommez et copiez ici : `public/landing/planning.png`, etc.
7. Relancez `npm run dev` — pas besoin de modifier le code.

## L'image ne change pas après remplacement ?

Next.js et le navigateur **mettent en cache** les images. Si vous remplacez `impression.png` et voyez l'ancienne :

1. **Hard refresh** : `Ctrl + Shift + R` (ou `Ctrl + F5`)
2. Ou supprimez le cache local : dossier `.next/cache/images` puis relancez `npm run dev`

## Tailles recommandées

| Type | Dimensions | Format |
|------|------------|--------|
| Desktop (hero, features, produits) | 1200×750 ou 1280×800 | PNG / WebP |
| Mobile candidat | 390×844 | PNG / WebP |

## Anciens noms (à supprimer)

Si vous aviez `planning2.png`, `tresorerie2.png`, `impression2.png` — remplacez-les par  
`planning.png`, `tresorerie.png`, `impression.png`.

Configuration : `app/components/landing/landing-data.ts`
