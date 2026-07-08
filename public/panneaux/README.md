# Banque d'images — panneaux & signalisation

Déposez ici les fichiers servis par Next.js (`/panneaux/...`).

## Formats acceptés

| Type | Format |
|------|--------|
| Panneaux, pictos | `.svg` (recommandé) |
| Photos, illustrations | `.webp`, `.jpg`, `.jpeg` |
| Transparence | `.webp` ou `.png` (si ≤ 500 Ko) |

## Nommage

Préférez le **code officiel** du panneau : `A1a.svg`, `B14.webp`, etc.

## Organisation interdiction / obligation

Pour distinguer **début** et **fin** de signalisation :

```
panneaux/
  interdiction/
    debut/     ← panneaux d'interdiction (circulaires)
    fin/       ← panneaux de fin d'interdiction (barrés)
  obligation/
    debut/     ← panneaux d'obligation (circulaires bleus)
    fin/       ← panneaux de fin d'obligation (barrés)
```

Les entrées sont définies dans `content/apprentissage/panneaux.json` (sections `debut` et `fin`).  
Voir les README dans chaque dossier `fin/` pour la correspondance fichier ↔ id.

## Dans l'admin

Référencez le chemin depuis la racine publique :

```
/panneaux/A1a.svg
/panneaux/danger/A1a.svg
```

Le texte de la leçon est stocké en base ; seul le chemin figure ici.
