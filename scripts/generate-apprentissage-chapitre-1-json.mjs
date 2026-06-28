import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

const chapter = {
  slug: "chapitre-1",
  step: 1,
  title: "Signalisation et règles de la circulation routière",
  subtitle: "Programme officiel — permis de conduire",
  description:
    "Signalisation verticale et horizontale, règles de circulation, infractions et feux du véhicule.",
  quizSlug: "quiz-chapitre-1",
  sections: [
    {
      slug: "signalisation-verticale",
      code: "1",
      title: "Signalisation verticale",
      lessons: [
        ["1-1-panneaux-danger", "1-1", "Panneaux de danger", "Forme, couleurs et familles de panneaux annonçant un danger."],
        ["1-2-panneaux-interdiction", "1-2", "Panneaux d'interdiction et de fin d'interdiction", "Interdictions, restrictions et levée d'interdiction."],
        ["1-3-panneaux-obligation", "1-3", "Panneaux d'obligation et de fin d'obligation", "Obligations imposées au conducteur et fin d'obligation."],
        ["1-4-panneaux-indication", "1-4", "Panneaux d'indication et de direction", "Informations utiles, services et directions."],
        ["1-5-panneaux-priorite", "1-5", "Panneaux de priorité", "Stop, cédez le passage, route prioritaire."],
        ["1-6-panonces", "1-6", "Panonceaux", "Compléments d'information sur les panneaux principaux."],
        ["1-7-balises-bornes", "1-7", "Balises et bornes kilométriques", "Guidage, délimitation et repères kilométriques."],
        ["1-8-feux-tricolores", "1-8", "Feux tricolores", "Feux rouge, orange et vert ; flèches et signaux associés."],
        ["1-9-agents-circulation", "1-9", "Agents de la circulation routière", "Police, gendarmerie et signaux manuels des agents."],
      ],
    },
    {
      slug: "signalisation-horizontale",
      code: "2",
      title: "Signalisation horizontale",
      lessons: [
        ["2-1-lignes", "2-1", "Lignes", "Lignes continues, discontinues, doubles et leur signification."],
        ["2-2-fleches", "2-2", "Flèches", "Flèches de direction, de sélection et de changement de voie."],
        ["2-3-voies-specialisees", "2-3", "Voies spécialisées", "Voies bus, cycles, piétons et autres affectations."],
        ["2-4-autres-marques", "2-4", "Autres marques", "Passages piétons, dos d'âne, zones hachurées et marquages divers."],
      ],
    },
    {
      slug: "signalisation-temporaire",
      code: "3",
      title: "Signalisation temporaire",
      lessons: [
        ["3-1-signalisation-temporaire-verticale", "3-1", "Signalisation temporaire verticale", "Panneaux et dispositifs lors de travaux ou d'événements."],
        ["3-2-signalisation-temporaire-horizontale", "3-2", "Signalisation temporaire horizontale", "Marquage provisoire au sol et déviations."],
      ],
    },
    {
      slug: "regles-circulation",
      code: "4",
      title: "Règles de la circulation routière",
      lessons: [
        ["4-1-regles-administratives", "4-1", "Règles administratives pour les véhicules et les conducteurs", "Documents, contrôles et obligations légales."],
        ["4-2-positionnement", "4-2", "Positionnement", "Placement du véhicule sur la chaussée et en chaussée."],
        ["4-3-croisement", "4-3", "Croisement", "Règles de croisement et dégagements latéraux."],
        ["4-4-depassement", "4-4", "Dépassement", "Conditions, interdictions et bonnes pratiques de dépassement."],
        ["4-5-priorite-passage", "4-5", "Priorité de passage", "Priorités aux intersections, ronds-points et passages."],
        ["4-6-vitesse", "4-6", "Vitesse", "Limitations, adaptation et distances de sécurité."],
        ["4-7-charge-vehicules", "4-7", "Charge et ensemble des véhicules", "Chargement, remorques et gabarits."],
        ["4-8-conduite-nuit", "4-8", "Conduite de nuit", "Éclairage, visibilité et vigilance nocturne."],
        ["4-9-conduite-mauvais-temps", "4-9", "Conduite par mauvais temps", "Pluie, brouillard, vent et chaussée glissante."],
        ["4-10-arret-stationnement", "4-10", "Arrêt et stationnement", "Différences, interdictions et règles de stationnement."],
      ],
    },
    {
      slug: "infractions",
      code: "5",
      title: "Infractions aux règles de la circulation routière et sanctions",
      lessons: [
        ["5-1-contraventions", "5-1", "Contraventions", "Infractions mineures, amendes et retrait de points."],
        ["5-2-delits", "5-2", "Délits", "Infractions graves et sanctions pénales."],
      ],
    },
    {
      slug: "feux-vehicule",
      code: "6",
      title: "Feux du véhicule",
      lessons: [
        ["6-1-feux-avant", "6-1", "Feux avant", "Code, route, antibrouillard et feux de jour."],
        ["6-2-feux-arriere", "6-2", "Feux arrière", "Feux de position, stop, recul et plaque."],
      ],
    },
  ],
}

for (const section of chapter.sections) {
  section.lessons = section.lessons.map(([slug, code, title, summary]) => ({
    slug,
    code,
    title,
    summary,
    body: null,
    bodyKab: null,
    images: [],
    published: true,
  }))
}

const outDir = join(root, "content", "apprentissage")
const out = join(outDir, "chapitre-1.json")
mkdirSync(outDir, { recursive: true })
writeFileSync(out, JSON.stringify(chapter, null, 2) + "\n", "utf8")
const count = chapter.sections.reduce((n, s) => n + s.lessons.length, 0)
console.log(`Wrote ${out} (${count} lessons)`)
