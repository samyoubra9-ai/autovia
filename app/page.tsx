import type { Metadata } from "next"

import { AutoviaLanding } from "./components/AutoviaLanding"
import type { LandingLinks } from "./components/landing/landing-links"
import {
  getAppUrl,
  getBackdashSignInUrl,
  getBackdashSignUpUrl,
} from "@/lib/app-urls"

import "./landing.css"

function getLandingLinks(): LandingLinks {
  const app = getAppUrl()
  return {
    backdashSignIn: getBackdashSignInUrl(),
    backdashSignUp: getBackdashSignUpUrl(),
    appSuivi: `${app}/suivi`,
  }
}

export const metadata: Metadata = {
  title: "Autovia - La gestion d'auto-école simplifiée",
  description:
    "SaaS pour auto-écoles en Algérie : planning, listes d'examen, paiements et suivi candidat par QR.",
  openGraph: {
    title: "Autovia — Gestion d'auto-école",
    description:
      "Plateforme complète pour auto-écoles : plannings, candidats, listes d'examen et portail élève.",
    type: "website",
  },
}

export default function Home() {
  return <AutoviaLanding links={getLandingLinks()} />
}
