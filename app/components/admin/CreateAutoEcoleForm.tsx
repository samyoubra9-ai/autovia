"use client"

import { useActionState } from "react"

import { createAutoEcoleAccount, type AdminActionResult } from "@/app/admin/actions"

const initial: AdminActionResult = {}

export function CreateAutoEcoleForm() {
  const [state, action, pending] = useActionState(
    async (_prev: AdminActionResult, formData: FormData) => {
      return createAutoEcoleAccount({
        nomAutoEcole: String(formData.get("nomAutoEcole") ?? ""),
        ville: String(formData.get("ville") ?? "") || undefined,
        telephone: String(formData.get("telephone") ?? "") || undefined,
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        prenom: String(formData.get("prenom") ?? ""),
        nom: String(formData.get("nom") ?? ""),
        adminNotes: String(formData.get("adminNotes") ?? "") || undefined,
      })
    },
    initial,
  )

  return (
    <form action={action} className="auth-form">
      {state.success && <p className="admin-alert admin-alert-success">{state.success}</p>}
      {state.error && <p className="admin-alert admin-alert-error">{state.error}</p>}

      <p className="auth-section-title">Auto-école</p>
      <fieldset className="auth-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <label htmlFor="nomAutoEcole">Nom *</label>
        <input id="nomAutoEcole" name="nomAutoEcole" required placeholder="Auto-École Horizon" />
      </fieldset>
      <div className="auth-row">
        <fieldset className="auth-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <label htmlFor="ville">Ville</label>
          <input id="ville" name="ville" placeholder="Alger" />
        </fieldset>
        <fieldset className="auth-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <label htmlFor="telephone">Téléphone</label>
          <input id="telephone" name="telephone" type="tel" />
        </fieldset>
      </div>

      <p className="auth-section-title">Compte de connexion (owner)</p>
      <div className="auth-row">
        <fieldset className="auth-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <label htmlFor="prenom">Prénom *</label>
          <input id="prenom" name="prenom" required />
        </fieldset>
        <fieldset className="auth-field" style={{ border: 0, padding: 0, margin: 0 }}>
          <label htmlFor="nom">Nom *</label>
          <input id="nom" name="nom" required />
        </fieldset>
      </div>
      <fieldset className="auth-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <label htmlFor="email">E-mail de connexion *</label>
        <input id="email" name="email" type="email" required />
      </fieldset>
      <fieldset className="auth-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <label htmlFor="password">Mot de passe *</label>
        <input id="password" name="password" type="password" required minLength={8} />
      </fieldset>
      <fieldset className="auth-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <label htmlFor="adminNotes">Note interne (optionnel)</label>
        <textarea id="adminNotes" name="adminNotes" rows={2} className="admin-notes-input" />
      </fieldset>

      <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 12px" }}>
        L&apos;accès backdash sera <strong>bloqué</strong> jusqu&apos;à ce que vous cliquiez
        « Débloquer (payé) ».
      </p>

      <button type="submit" className="auth-btn" disabled={pending}>
        {pending ? "Création…" : "Créer le compte"}
      </button>
    </form>
  )
}
