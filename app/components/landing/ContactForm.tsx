"use client"

import { useState, type FormEvent } from "react"

type FormStatus = "idle" | "loading" | "success" | "error"

const SUBJECT_OPTIONS = [
  { value: "", label: "Choisir un sujet (optionnel)" },
  { value: "demo", label: "Demande de démo" },
  { value: "tarifs", label: "Question sur les tarifs" },
  { value: "support", label: "Support technique" },
  { value: "autre", label: "Autre" },
] as const

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    const form = e.currentTarget
    const fd = new FormData(form)

    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      autoEcole: String(fd.get("autoEcole") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""),
    }

    try {
      const res = await fetch("/api/v1/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (!res.ok) {
        setStatus("error")
        setErrorMessage(
          data.error || "Une erreur est survenue. Veuillez réessayer.",
        )
        return
      }

      setStatus("success")
      form.reset()
    } catch {
      setStatus("error")
      setErrorMessage(
        "Connexion impossible. Vérifiez votre réseau et réessayez.",
      )
    }
  }

  if (status === "success") {
    return (
      <div className="ds-contact-success" role="status">
        <h3>Message envoyé</h3>
        <p>
          Merci ! Nous avons bien reçu votre message et vous répondrons à
          l&apos;adresse indiquée dès que possible.
        </p>
        <button
          type="button"
          className="ds-btn ds-btn-secondary"
          onClick={() => setStatus("idle")}
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  return (
    <form className="ds-contact-form" onSubmit={handleSubmit} noValidate>
      <div className="ds-contact-honeypot" aria-hidden>
        <label htmlFor="contact-website">Site web</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="ds-contact-grid">
        <div className="ds-contact-field">
          <label htmlFor="contact-name">Nom *</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={120}
            disabled={status === "loading"}
          />
        </div>

        <div className="ds-contact-field">
          <label htmlFor="contact-email">Votre e-mail *</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            placeholder="vous@exemple.com"
            disabled={status === "loading"}
          />
        </div>

        <div className="ds-contact-field">
          <label htmlFor="contact-auto-ecole">Auto-école (optionnel)</label>
          <input
            id="contact-auto-ecole"
            name="autoEcole"
            type="text"
            autoComplete="organization"
            maxLength={200}
            disabled={status === "loading"}
          />
        </div>

        <div className="ds-contact-field">
          <label htmlFor="contact-subject">Sujet</label>
          <select
            id="contact-subject"
            name="subject"
            defaultValue=""
            disabled={status === "loading"}
          >
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt.value || "default"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ds-contact-field ds-contact-field--full">
          <label htmlFor="contact-message">Message *</label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            minLength={10}
            maxLength={5000}
            placeholder="Décrivez votre demande…"
            disabled={status === "loading"}
          />
        </div>
      </div>

      {status === "error" && errorMessage ? (
        <p className="ds-contact-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        className="ds-btn ds-btn-primary ds-btn-lg"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  )
}
