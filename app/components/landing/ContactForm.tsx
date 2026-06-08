"use client"

import { useState, type FormEvent } from "react"

import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"
import { formatVitrineMessage } from "@/lib/i18n/vitrine-messages"
import { getPublicContactEmail } from "@/lib/contact/public-email"

type FormStatus = "idle" | "loading" | "success" | "error"

export function ContactForm() {
  const m = useVitrineMessages()
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const subjectOptions = [
    { value: "", label: m.contact.subjectPlaceholder },
    { value: "demo", label: m.contact.subjects.demo },
    { value: "tarifs", label: m.contact.subjects.tarifs },
    { value: "support", label: m.contact.subjects.support },
    { value: "autre", label: m.contact.subjects.autre },
  ] as const

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

    const contactEmail = getPublicContactEmail()

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
          data.error ||
            formatVitrineMessage(m.contact.errorGeneric, { email: contactEmail }),
        )
        return
      }

      setStatus("success")
      form.reset()
    } catch {
      setStatus("error")
      setErrorMessage(
        formatVitrineMessage(m.contact.errorNetwork, { email: contactEmail }),
      )
    }
  }

  if (status === "success") {
    return (
      <div className="ds-contact-success" role="status">
        <h3>{m.contact.successTitle}</h3>
        <p>{m.contact.successText}</p>
        <button
          type="button"
          className="ds-btn ds-btn-secondary"
          onClick={() => setStatus("idle")}
        >
          {m.contact.sendAnother}
        </button>
      </div>
    )
  }

  return (
    <form className="ds-contact-form" onSubmit={handleSubmit} noValidate>
      <div className="ds-contact-honeypot" aria-hidden>
        <label htmlFor="contact-website">{m.contact.honeypotLabel}</label>
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
          <label htmlFor="contact-name">{m.contact.nameLabel}</label>
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
          <label htmlFor="contact-email">{m.contact.emailLabel}</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            placeholder={m.contact.emailPlaceholder}
            disabled={status === "loading"}
          />
        </div>

        <div className="ds-contact-field">
          <label htmlFor="contact-auto-ecole">{m.contact.schoolLabel}</label>
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
          <label htmlFor="contact-subject">{m.contact.subjectLabel}</label>
          <select
            id="contact-subject"
            name="subject"
            defaultValue=""
            disabled={status === "loading"}
          >
            {subjectOptions.map((opt) => (
              <option key={opt.value || "default"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ds-contact-field ds-contact-field--full">
          <label htmlFor="contact-message">{m.contact.messageLabel}</label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            minLength={10}
            maxLength={5000}
            placeholder={m.contact.messagePlaceholder}
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
        {status === "loading" ? m.contact.submitting : m.contact.submit}
      </button>
    </form>
  )
}
