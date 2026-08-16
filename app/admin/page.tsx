import { redirect } from "next/navigation"

import { requireSiteAdmin } from "@/lib/admin-auth"

/** Admin Next.js = contenu apprentissage uniquement (SaaS → platform-admin). */
export default async function AdminPage() {
  await requireSiteAdmin()
  redirect("/admin/apprentissage")
}
