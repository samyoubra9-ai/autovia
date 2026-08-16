# Signaux d'agent de l'ordre

Images des gestes des agents de la circulation (police, gendarmerie, etc.).

Les fiches sont listées dans `content/apprentissage/panneaux.json` → famille `agent-ordre` → tableau `signs`.

## Fichiers attendus (exemples du JSON)

| Fichier | Fiche |
|---------|--------|
| `bras-leve.webp` | Bras levé vers le haut |
| `bras-horizontal.webp` | Bras tendus horizontalement |
| `mouvement-bras.webp` | Mouvement des bras |
| `face-agent-arret.webp` | Face à l'agent — arrêt |
| `dos-agent-circulation.webp` | Dos à l'agent — circulation autorisée |
| `profil-arret.webp` | Profil de l'agent — arrêt latéral |
| `main-tendue.webp` | Main tendue vers l'avant |
| `sifflet.webp` | Appel du sifflet |

## Ajouter un signal

1. Déposez l'image ici (`.webp` ou `.svg` recommandé).
2. Ajoutez une entrée dans le JSON :

```json
{
  "id": "AO9",
  "name": "Signal de ralentissement",
  "meaning": "Réduire la vitesse et se préparer à s'arrêter si nécessaire.",
  "image": "/panneaux/agent-ordre/ralentissement.webp"
}
```

- **id** : code court unique (ex. `AO9`, `AO10`)
- **name** : libellé affiché sur la fiche
- **meaning** : explication pour l'apprenant
- **image** : chemin depuis `public/` (commence par `/panneaux/agent-ordre/`)
