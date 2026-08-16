# Scénarios d'intersections

Images des situations à l'intersection (`public/intersections/scenarios/`).

Les fiches sont dans `content/apprentissage/intersections.json` → chaque `type` → objet `scenario`.

## Ordre de passage (`passingOrder`)

Indiquez **quel véhicule passe en premier**, puis le suivant, etc. La couleur doit correspondre à celle du véhicule sur votre image.

```json
"passingOrder": [
  [
    { "color": "blue", "label": "Véhicule bleu" },
    { "color": "yellow", "label": "Véhicule jaune" }
  ],
  [{ "color": "red", "label": "Véhicule rouge" }]
]
```

- Chaque **tableau interne** = une étape (les véhicules dedans passent **en même temps**)
- Le **1er tableau** = passe en premier
- Le **2e tableau** = passe ensuite
- Un seul véhicule par étape : `[{ "color": "red" }]`
- Format simple (un véhicule par étape, l'un après l'autre) toujours accepté :

```json
"passingOrder": [
  { "color": "red", "label": "Véhicule B" },
  { "color": "blue", "label": "Véhicule A" }
]
```

| `color` | Usage |
|---------|--------|
| `red` | Véhicule rouge |
| `blue` | Véhicule bleu |
| `green` | Véhicule vert |
| `yellow` | Véhicule jaune |
| `orange` | Véhicule orange |
| `purple` | Véhicule violet |
| `black` | Véhicule noir |
| `white` | Véhicule blanc |

- **label** (optionnel) : texte affiché. Si omis, libellé par défaut (ex. « Véhicule rouge »)

### Couleurs disponibles
