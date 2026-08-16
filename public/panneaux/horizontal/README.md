# Signalisation horizontale

Images des marquages au sol (lignes, zébras, flèches…).

Les fiches sont listées dans `content/apprentissage/panneaux.json` → famille `horizontal` → tableau `signs`.

## Fichiers existants / exemples du JSON

| Fichier | Fiche |
|---------|--------|
| `ligne-continue.webp` | Ligne continue |
| `delimitation.webp` | Délimitation chaussée / voies |
| `delimitation2.webp` | Délimitation voies réservées |
| `avertissement.webp` | Ligne d'avertissement |
| `separation.webp` | Ligne de séparation |
| `continueetdiscontinue.webp` | Ligne continue + discontinue |
| `ligne-discontinue.webp` | Ligne discontinue *(à ajouter)* |
| `passage-pieton.webp` | Passage piéton *(à ajouter)* |
| `fleche-tout-droit.webp` | Flèche tout droit *(à ajouter)* |
| `fleche-droite.webp` | Flèche tourner à droite *(à ajouter)* |
| `zone-hachuree.webp` | Zone hachurée *(à ajouter)* |

## Ajouter un marquage

1. Déposez l'image ici (`.webp` ou `.svg` recommandé).
2. Ajoutez une entrée dans le JSON :

```json
{
  "id": "M2",
  "name": "Bande d'arrêt d'urgence",
  "meaning": "Zone réservée à l'arrêt en cas d'urgence.",
  "image": "/panneaux/horizontal/bande-arret-urgence.webp"
}
```

- **id** : code court unique (ex. `L4`, `T3`, `M2`)
- **name** : libellé affiché sur la fiche
- **meaning** : explication pour l'apprenant
- **image** : chemin depuis `public/` (commence par `/panneaux/horizontal/`)
