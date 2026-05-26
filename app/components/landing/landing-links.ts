/** URLs injectées depuis le serveur (lib/app-urls + .env). */
export type LandingLinks = {
  /** NEXT_PUBLIC_BACKDASH_URL + /sign-in */
  backdashSignIn: string
  /** NEXT_PUBLIC_BACKDASH_URL + /sign-up */
  backdashSignUp: string
  /** NEXT_PUBLIC_APP_URL + /suivi */
  appSuivi: string
}

export function buildProductCards(links: LandingLinks) {
  return [
    {
      id: "backdash",
      title: "Autovia",
      subtitle: "Espace auto-école",
      description:
        "Tableau de bord, élèves, moniteurs, véhicules, séances, paiements et listes d'examen — tout le quotidien de votre école.",
      imageKey: "backdash" as const,
      href: links.backdashSignIn,
      external: true,
    },
    {
      id: "candidat",
      title: "Portail candidat",
      subtitle: "PWA mobile",
      description:
        "Vos élèves consultent leur progression, leurs séances et leur code de suivi depuis le téléphone, même hors ligne.",
      imageKey: "candidat" as const,
      href: links.appSuivi,
      external: false,
    },
    {
      id: "platform",
      title: "Inscription",
      subtitle: "Essai gratuit",
      description:
        "Création de compte, paramètres d'impression, catégories de permis et gestion de l'accès à la plateforme.",
      imageKey: "hero" as const,
      href: links.backdashSignUp,
      external: true,
    },
  ]
}
