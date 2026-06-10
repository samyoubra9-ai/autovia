"use client"

import { useState } from "react"
import Link from "next/link"

import { createSiteAdminProfile } from "@/app/auth/actions"
import { createClient } from "@/lib/supabase/client"

type Props = {
  /** Utilisateur déjà connecté (e-mail confirmé) — il ne reste qu'à enregistrer en BDD */
  finishOnly?: boolean
  email?: string
}

export function SetupAdminForm({ finishOnly = false, email }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function finishProfile() {
    setError(null)
    setPending(true)
    const result = await createSiteAdminProfile()
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)

    const form = new FormData(e.currentTarget)
    const signupEmail = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const passwordConfirm = String(form.get("passwordConfirm") ?? "")

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.")
      setPending(false)
      return
    }

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: signupEmail,
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

    if (data.user && !data.session) {
      setSuccess(
        "Compte Auth créé. Ouvrez le lien dans votre e-mail, puis revenez ici ou sur /signin — votre profil admin sera enregistré en base automatiquement.",
      )
      setPending(false)
      return
    }

    await finishProfile()
  }

  if (finishOnly) {
    return (
      <>
        <h1 className="auth-title">Finaliser l&apos;administrateur</h1>
        <p className="auth-subtitle">
          Votre e-mail est confirmé (<strong>{email}</strong>). Cliquez pour enregistrer votre compte
          dans la base de données (<code>site_admins</code>).
        </p>

        {error && <p className="auth-error">{error}</p>}

        <button
          type="button"
          className="auth-btn"
          disabled={pending}
          onClick={() => void finishProfile()}
        >
          {pending ? "Enregistrement…" : "Enregistrer mon profil admin en base"}
        </button>

        <p className="auth-footer" style={{ marginTop: 16 }}>
          <Link href="/signin">Se connecter avec un autre compte</Link>
        </p>
      </>
    )
  }

  return (
    <>
      <h1 className="auth-title">Créer l&apos;administrateur</h1>
      <p className="auth-subtitle">
        Compte éditeur du parcours apprentissage (leçons code de la route). Supprimez{" "}
        <code>/setup-admin</code> après la première création.
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="email">E-mail *</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Mot de passe *</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="passwordConfirm">Confirmer le mot de passe *</label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {success && <p className="auth-success">{success}</p>}
        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-btn" disabled={pending}>
          {pending ? "Création…" : "Créer mon compte admin"}
        </button>
      </form>
    </>
  )
}
