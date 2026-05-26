"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { registerTenant } from "@/app/auth/actions"
import { getAutoEcoleAvatarColor, getAutoEcoleAvatarLetter } from "@/lib/avatar"
import { createClient } from "@/lib/supabase/client"

export function CompleteSignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [prenom, setPrenom] = useState("")
  const [nom, setNom] = useState("")
  const [nomAutoEcole, setNomAutoEcole] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = "/signin"
        return
      }
      setEmail(user.email ?? "")
      const meta = user.user_metadata ?? {}
      const fullName = (meta.full_name ?? meta.name ?? "") as string
      const parts = fullName.trim().split(/\s+/)
      if (meta.given_name) setPrenom(String(meta.given_name))
      else if (parts[0]) setPrenom(parts[0])
      if (meta.family_name) setNom(String(meta.family_name))
      else if (parts.length > 1) setNom(parts.slice(1).join(" "))
      setLoading(false)
    })
  }, [])

  const previewLetter = getAutoEcoleAvatarLetter(nomAutoEcole || "A")
  const previewColor = getAutoEcoleAvatarColor(nomAutoEcole || "Auto")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(e.currentTarget)
    const result = await registerTenant({
      nomAutoEcole: String(form.get("nomAutoEcole") ?? "").trim(),
      ville: String(form.get("ville") ?? "").trim() || undefined,
      telephone: String(form.get("telephone") ?? "").trim() || undefined,
      prenom: String(form.get("prenom") ?? "").trim(),
      nom: String(form.get("nom") ?? "").trim(),
    })

    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-card auth-card-wide">
        <p className="auth-subtitle">Chargement…</p>
      </div>
    )
  }

  return (
    <div className="auth-card auth-card-wide">
      <div className="auth-logo">
        <div className="auth-avatar" style={{ backgroundColor: previewColor }} aria-hidden>
          {previewLetter}
        </div>
        <div>
          <h1 className="auth-title" style={{ marginBottom: 0 }}>
            Finaliser l&apos;inscription
          </h1>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748b" }}>
            Connecté avec {email}
          </p>
        </div>
      </div>

      <span className="auth-trial-badge">Essai gratuit 15 jours</span>
      <p className="auth-subtitle">
        Complétez les informations de votre auto-école pour accéder au tableau de bord.
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <p className="auth-section-title">Votre auto-école</p>
        <div className="auth-field">
          <label htmlFor="nomAutoEcole">Nom de l&apos;auto-école *</label>
          <input
            id="nomAutoEcole"
            name="nomAutoEcole"
            required
            placeholder="Ex. Auto-École Horizon"
            value={nomAutoEcole}
            onChange={(e) => setNomAutoEcole(e.target.value)}
          />
        </div>
        <div className="auth-row">
          <div className="auth-field">
            <label htmlFor="ville">Ville</label>
            <input id="ville" name="ville" placeholder="Ex. Alger" />
          </div>
          <div className="auth-field">
            <label htmlFor="telephone">Téléphone</label>
            <input id="telephone" name="telephone" type="tel" />
          </div>
        </div>

        <p className="auth-section-title">Administrateur</p>
        <div className="auth-row">
          <div className="auth-field">
            <label htmlFor="prenom">Prénom *</label>
            <input
              id="prenom"
              name="prenom"
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="nom">Nom *</label>
            <input id="nom" name="nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-btn" disabled={pending}>
          {pending ? "Création…" : "Accéder au tableau de bord"}
        </button>
      </form>

      <p className="auth-footer">
        <Link href="/signin">Retour à la connexion</Link>
      </p>
    </div>
  )
}
