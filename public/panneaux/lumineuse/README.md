# Signalisation lumineuse

Images des feux et dispositifs lumineux (tricolores, clignotants, signaux piétons…).

Les fiches sont listées dans `content/apprentissage/panneaux.json` → famille `lumineuse` → tableau `signs`.

## Fichiers attendus (exemples du JSON)

| Fichier | Fiche |
|---------|--------|
| `feu-rouge.webp` | Feu rouge |
| `feu-orange.webp` | Feu orange |
| `feu-vert.webp` | Feu vert |
| `feu-orange-clignotant.webp` | Feu orange clignotant |
| `feu-rouge-fleche-droite.webp` | Feu rouge avec flèche à droite |
| `feu-vert-fleche.webp` | Feu vert avec flèche |
| `feu-rouge-clignotant.webp` | Feu rouge clignotant |
| `pieton-rouge.webp` | Signal piéton rouge |
| `pieton-vert.webp` | Signal piéton vert |

## Ajouter un signal

1. Déposez l'image ici (`.webp` ou `.svg` recommandé).
2. Ajoutez une entrée dans le JSON :

```json
{
  "id": "F10",
  "name": "Feu jaune clignotant",
  "meaning": "Prudence, danger ou travaux à proximité.",
  "image": "/panneaux/lumineuse/feu-jaune-clignotant.webp"
}
```

- **id** : code court unique (ex. `F10`, `F11`)
- **name** : libellé affiché sur la fiche
- **meaning** : explication pour l'apprenant
- **image** : chemin depuis `public/` (commence par `/panneaux/lumineuse/`)
