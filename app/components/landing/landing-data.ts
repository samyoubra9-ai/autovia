/** Chemins des visuels — remplacez les fichiers dans /public/landing/ (même nom). */
export const LANDING_IMAGES = {
  hero: {
    src: "/landing/headimage.png",
    alt: "Tableau de bord Autovia — gestion auto-école",
    width: 1280,
    height: 800,
  },
  backdash: {
    src: "/landing/espaceauto.png",
    alt: "Interface Autovia — espace auto-école",
    width: 1200,
    height: 750,
  },
  planning: {
    src: "/landing/planning2.png",
    alt: "Planning des séances de conduite",
    width: 1200,
    height: 750,
  },
  eleves: {
    src: "/landing/tresorerie2.png",
    alt: "Candidats et trésorerie — fiches élèves et paiements",
    width: 1200,
    height: 750,
  },
  listeExamen: {
    src: "/landing/impression2.png",
    alt: "Listes d'examen et impression officielle",
    width: 1200,
    height: 750,
  },
  candidat: {
    src: "/landing/pwa.png",
    alt: "Application candidat — suivi par code QR",
    width: 390,
    height: 844,
  },
} as const

export const HERO_BULLETS = [
  "Planning moniteurs sans chevauchement",
  "Listes d'examen imprimables (format officiel)",
  "Suivi candidat mobile par QR",
] as const

export const FEATURE_BLOCKS = [
  {
    title: "Plannings de conduite intelligents",
    description:
      "Organisez les créneaux par moniteur et par véhicule. Visualisez la semaine en un coup d'œil et évitez les doubles réservations.",
    imageKey: "planning" as const,
    reverse: false,
  },
  {
    title: "Candidats & trésorerie centralisés",
    description:
      "Fiche complète par élève : étapes du permis, reste à payer, historique des versements et documents. Gardez la caisse sous contrôle.",
    imageKey: "eleves" as const,
    reverse: true,
  },
  {
    title: "Listes d'examen prêtes à imprimer",
    description:
      "Génération des listes avec pagination A4, texte arabe et signature. Conçu pour les pratiques des auto-écoles en Algérie.",
    imageKey: "listeExamen" as const,
    reverse: false,
  },
] as const

export const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Créez votre auto-école",
    text: "Inscription en ligne, choix des catégories de permis et paramètres d'impression en quelques minutes.",
  },
  {
    step: "02",
    title: "Gérez au quotidien",
    text: "Ajoutez les candidats, planifiez les séances, enregistrez les paiements et préparez les listes d'examen.",
  },
  {
    step: "03",
    title: "Vos candidats suivent leur dossier",
    text: "Chaque élève reçoit un code de suivi pour consulter sa progression sur l'application candidat.",
  },
] as const

export const FAQ_ITEMS = [
  {
    q: "Autovia est-il adapté aux auto-écoles en Algérie ?",
    a: "Oui. Listes d'examen, libellés bilingues, catégories de permis et flux métier sont pensés pour le marché local.",
  },
  {
    q: "Faut-il installer un logiciel sur le PC ?",
    a: "Non. Autovia fonctionne dans le navigateur ; l'app candidat s'installe comme une PWA sur téléphone.",
  },
  {
    q: "Combien de candidats puis-je gérer ?",
    a: "L'essai gratuit permet jusqu'à 10 élèves pendant 15 jours. Le plan Pro inclut un nombre illimité de candidats et de moniteurs.",
  },
  {
    q: "Les données sont-elles sécurisées ?",
    a: "Hébergement cloud avec authentification sécurisée. Chaque auto-école accède uniquement à ses propres données.",
  },
] as const
