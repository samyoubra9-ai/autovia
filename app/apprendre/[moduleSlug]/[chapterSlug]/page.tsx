import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ moduleSlug: string; chapterSlug: string }>
}

export default async function LegacyChapterRedirect({ params }: PageProps) {
  const { moduleSlug } = await params
  if (moduleSlug === "chapitre-1") redirect("/apprendre/panneaux")
  redirect("/apprendre")
}
