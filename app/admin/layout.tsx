import type { ReactNode } from "react"

import { AdminShell } from "@/app/components/admin/AdminShell"
import { requireSiteAdmin } from "@/lib/admin-auth"

import "../auth/auth.css"
import "./admin.css"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { siteAdmin } = await requireSiteAdmin()
  return <AdminShell email={siteAdmin.email}>{children}</AdminShell>
}
