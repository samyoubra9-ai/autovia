"use client"

import { useState } from "react"
import Link from "next/link"

import { registerTenant } from "@/app/auth/actions"
import { GoogleAuthButton } from "@/app/components/auth/GoogleAuthButton"
import { getAutoEcoleAvatarColor, getAutoEcoleAvatarLetter } from "@/lib/avatar"
import { createClient } from "@/lib/supabase/client"

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [nomAutoEcole, setNomAutoEcole] = useState("")

  const previewLetter = getAutoEcoleAvatarLetter(nomAutoEcole || "A")
  const previewColor = getAutoEcoleAvatarColor(nomAutoEcole || "Auto")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const nomEcole = String(form.get("nomAutoEcole") ?? "").trim()
    const prenom = String(form.get("prenom") ?? "").trim()
    const nom = String(form.get("nom") ?? "").trim()
    const ville = String(form.get("ville") ?? "").trim()
    const telephone = String(form.get("telephone") ?? "").trim()

    const supabase = createClient()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/post-login`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setPending(false)
      return
    }

    if (signUpData.user && !signUpData.session) {
      setSuccess(
        "Compte créé ! Vérifiez votre boîte e-mail et cliquez sur le lien de confirmation pour continuer.",
      )
      setPending(false)
      return
    }

    const result = await registerTenant({
      nomAutoEcole: nomEcole,
      ville: ville || undefined,
      telephone: telephone || undefined,
      prenom,
      nom,
    })

    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <div className="auth-card auth-card-wide">
      <div className="auth-logo">
        <div
          className="auth-avatar"
          style={{ backgroundColor: previewColor }}
          aria-hidden
        >
          {previewLetter}
        </div>
        <div>
          <h1 className="auth-title" style={{ marginBottom: 0 }}>
            Créer votre espace
          </h1>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748b" }}>
            Autovia
          </p>
        </div>
      </div>

      <span className="auth-trial-badge">Essai gratuit 15 jours — sans carte</span>
      <p className="auth-subtitle">
        Inscrivez votre auto-école et accédez au tableau de bord.
      </p>

      <GoogleAuthButton mode="signup" label="S'inscrire avec Google" />

      <div className="auth-divider">ou avec e-mail</div>

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
            <input id="telephone" name="telephone" type="tel" placeholder="05 XX XX XX XX" />
          </div>
        </div>

        <p className="auth-section-title">Administrateur</p>
        <div className="auth-row">
          <div className="auth-field">
            <label htmlFor="prenom">Prénom *</label>
            <input id="prenom" name="prenom" required placeholder="Prénom" />
          </div>
          <div className="auth-field">
            <label htmlFor="nom">Nom *</label>
            <input id="nom" name="nom" required placeholder="Nom" />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="email">E-mail *</label>
          <input id="email" name="email" type="email" required placeholder="vous@autoecole.dz" />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Mot de passe *</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="8 caractères minimum"
          />
        </div>

        {success && <p className="auth-success">{success}</p>}
        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-btn" disabled={pending}>
          {pending ? "Création en cours…" : "Démarrer l'essai gratuit"}
        </button>
      </form>

      <p className="auth-footer">
        Déjà inscrit ? <Link href="/signin">Se connecter</Link>
      </p>
    </div>
  )
}

