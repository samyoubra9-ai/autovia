import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** Keep in sync with lib/apprentissage/programme/chapitre-1.ts */
const META = {
  title: "Signalisation et règles de la circulation routière",
  subtitle: "Programme officiel — permis de conduire",
  description:
    "Signalisation verticale et horizontale, règles de circulation, infractions et feux du véhicule.",
}

const SECTIONS = [
  {
    lessons: [
      ["1-1-panneaux-danger", "Panneaux de danger", "Forme, couleurs et familles de panneaux annonçant un danger."],
      ["1-2-panneaux-interdiction", "Panneaux d'interdiction et de fin d'interdiction", "Interdictions, restrictions et levée d'interdiction."],
      ["1-3-panneaux-obligation", "Panneaux d'obligation et de fin d'obligation", "Obligations imposées au conducteur et fin d'obligation."],
      ["1-4-panneaux-indication", "Panneaux d'indication et de direction", "Informations utiles, services et directions."],
      ["1-5-panneaux-priorite", "Panneaux de priorité", "Stop, cédez le passage, route prioritaire."],
      ["1-6-panonces", "Panonceaux", "Compléments d'information sur les panneaux principaux."],
      ["1-7-balises-bornes", "Balises et bornes kilométriques", "Guidage, délimitation et repères kilométriques."],
      ["1-8-feux-tricolores", "Feux tricolores", "Feux rouge, orange et vert ; flèches et signaux associés."],
      ["1-9-agents-circulation", "Agents de la circulation routière", "Police, gendarmerie et signaux manuels des agents."],
    ],
  },
  {
    lessons: [
      ["2-1-lignes", "Lignes", "Lignes continues, discontinues, doubles et leur signification."],
      ["2-2-fleches", "Flèches", "Flèches de direction, de sélection et de changement de voie."],
      ["2-3-voies-specialisees", "Voies spécialisées", "Voies bus, cycles, piétons et autres affectations."],
      ["2-4-autres-marques", "Autres marques", "Passages piétons, dos d'âne, zones hachurées et marquages divers."],
    ],
  },
  {
    lessons: [
      ["3-1-signalisation-temporaire-verticale", "Signalisation temporaire verticale", "Panneaux et dispositifs lors de travaux ou d'événements."],
      ["3-2-signalisation-temporaire-horizontale", "Signalisation temporaire horizontale", "Marquage provisoire au sol et déviations."],
    ],
  },
  {
    lessons: [
      ["4-1-regles-administratives", "Règles administratives pour les véhicules et les conducteurs", "Documents, contrôles et obligations légales."],
      ["4-2-positionnement", "Positionnement", "Placement du véhicule sur la chaussée et en chaussée."],
      ["4-3-croisement", "Croisement", "Règles de croisement et dégagements latéraux."],
      ["4-4-depassement", "Dépassement", "Conditions, interdictions et bonnes pratiques de dépassement."],
      ["4-5-priorite-passage", "Priorité de passage", "Priorités aux intersections, ronds-points et passages."],
      ["4-6-vitesse", "Vitesse", "Limitations, adaptation et distances de sécurité."],
      ["4-7-charge-vehicules", "Charge et ensemble des véhicules", "Chargement, remorques et gabarits."],
      ["4-8-conduite-nuit", "Conduite de nuit", "Éclairage, visibilité et vigilance nocturne."],
      ["4-9-conduite-mauvais-temps", "Conduite par mauvais temps", "Pluie, brouillard, vent et chaussée glissante."],
      ["4-10-arret-stationnement", "Arrêt et stationnement", "Différences, interdictions et règles de stationnement."],
    ],
  },
  {
    lessons: [
      ["5-1-contraventions", "Contraventions", "Infractions mineures, amendes et retrait de points."],
      ["5-2-delits", "Délits", "Infractions graves et sanctions pénales."],
    ],
  },
  {
    lessons: [
      ["6-1-feux-avant", "Feux avant", "Code, route, antibrouillard et feux de jour."],
      ["6-2-feux-arriere", "Feux arrière", "Feux de position, stop, recul et plaque."],
    ],
  },
]

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const esc = (s) => s.replace(/'/g, "''")

let order = 0
let sql = `-- LocalAutovia / Autovia — seed apprentissage chapitre 1
-- Exécuter après docs/sql/learning-content.sql
-- npx supabase db query --file docs/sql/learning-chapitre-1-seed.sql

INSERT INTO learning_modules (id, slug, step, title_fr, subtitle_fr, description_fr, published)
VALUES (
  'lm-chapitre-1',
  'chapitre-1',
  1,
  '${esc(META.title)}',
  '${esc(META.subtitle)}',
  '${esc(META.description)}',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title_fr = EXCLUDED.title_fr,
  subtitle_fr = EXCLUDED.subtitle_fr,
  description_fr = EXCLUDED.description_fr,
  step = EXCLUDED.step;

`

for (const section of SECTIONS) {
  for (const [slug, title, summary] of section.lessons) {
    order += 1
    const id = `lc-${slug}`
    sql += `INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  '${id}',
  'lm-chapitre-1',
  '${slug}',
  ${order},
  '${esc(title)}',
  '${esc(summary)}',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

`
  }
}

sql += `SELECT COUNT(*)::int AS lecons_chapitre_1 FROM learning_chapters WHERE module_id = 'lm-chapitre-1';
`

const out = join(root, "docs/sql/learning-chapitre-1-seed.sql")
writeFileSync(out, sql, "utf8")
console.log(`Wrote ${out} (${order} lessons)`)
