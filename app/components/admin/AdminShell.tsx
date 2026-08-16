"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, GraduationCap, Home, LogOut } from "lucide-react"

import { signOut } from "@/app/auth/actions"

type AdminShellProps = {
  email: string
  children: React.ReactNode
}

export function AdminShell({ email, children }: AdminShellProps) {
  const pathname = usePathname()
  const onApprentissage = pathname.startsWith("/admin/apprentissage")

  return (
    <div className="admin-shell admin-shell--pro">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">
            <BookOpen className="size-5" aria-hidden />
          </div>
          <div>
            <p className="admin-sidebar-title">Autovia</p>
            <p className="admin-sidebar-sub">Admin apprentissage</p>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Administration">
          <Link
            href="/admin/apprentissage"
            className={`admin-sidebar-link${onApprentissage ? " admin-sidebar-link--active" : ""}`}
          >
            <GraduationCap className="size-4 shrink-0" aria-hidden />
            Contenu apprentissage
          </Link>
        </nav>

        <div className="admin-sidebar-foot">
          <p className="admin-sidebar-email">{email}</p>
          <div className="admin-sidebar-actions">
            <Link href="/apprendre" className="admin-sidebar-btn">
              <Home className="size-3.5" aria-hidden />
              Parcours
            </Link>
            <form action={signOut}>
              <button type="submit" className="admin-sidebar-btn">
                <LogOut className="size-3.5" aria-hidden />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  )
}
