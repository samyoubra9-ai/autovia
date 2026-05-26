import type { ReactNode } from "react"

import { requireSiteAdmin } from "@/lib/admin-auth"

import "../auth/auth.css"
import "./admin.css"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSiteAdmin()
  return children
}
