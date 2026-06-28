import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ moduleSlug: string }>
}

export default async function LegacyModuleRedirect({ params }: PageProps) {
  const { moduleSlug } = await params
  if (moduleSlug === "chapitre-1") redirect("/apprendre/panneaux")
  redirect("/apprendre")
}
