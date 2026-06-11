import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { WhatsAppFloatingButton } from "./components/vitrine/WhatsAppFloatingButton"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Autovia - La gestion d'auto-école simplifiée",
    template: "%s | Autovia",
  },
  description:
    "Plateforme moderne pour auto-écoles en Algérie : plannings, candidats, paiements et tableau de bord sur une seule interface.",
  manifest: "/brand/favicon/site.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon/favicon.ico", sizes: "any" },
      {
        url: "/brand/favicon/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/brand/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    images: [
      {
        url: "/brand/favicon/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Autovia",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <WhatsAppFloatingButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
