"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { ImagePlus, Trash2 } from "lucide-react"

import {
  createLearningChapter,
  deleteLearningChapter,
  updateLearningChapter,
  type LearningActionResult,
} from "@/app/admin/apprentissage/actions"
import type { LearningChapterImage } from "@/lib/learning/types"

const ALLOWED_IMAGE_EXTENSIONS = [".svg", ".webp", ".jpg", ".jpeg", ".png"]
const RECOMMENDED_MAX_IMAGE_KB = 500

type ChapterFormProps = {
  mode: "create" | "edit"
  moduleSlug: string
  chapterSlug?: string
  chapterId?: string
  initial: {
    slug?: string
    sortOrder: number
    titleFr: string
    titleKab: string
    summaryFr: string
    summaryKab: string
    bodyFr: string
    bodyKab: string
    published: boolean
    images: LearningChapterImage[]
  }
}

function emptyImage(sortOrder: number): LearningChapterImage {
  return { src: "", altFr: "", sortOrder }
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
      {pending ? "Enregistrement…" : label}
    </button>
  )
}

export function ChapterForm({
  mode,
  moduleSlug,
  chapterSlug,
  chapterId,
  initial,
}: ChapterFormProps) {
  const [images, setImages] = useState<LearningChapterImage[]>(
    initial.images.length > 0 ? initial.images : [],
  )
  const [deletePending, setDeletePending] = useState(false)

  const saveAction = useMemo(
    () =>
      mode === "create"
        ? createLearningChapter.bind(null, moduleSlug)
        : updateLearningChapter.bind(null, moduleSlug, chapterSlug!),
    [mode, moduleSlug, chapterSlug],
  )

  const [state, formAction] = useActionState<LearningActionResult | null, FormData>(
    async (_prev, formData) => saveAction(formData),
    null,
  )

  async function handleDelete() {
    if (!chapterId || !window.confirm("Supprimer définitivement cette leçon ?")) {
      return
    }
    setDeletePending(true)
    await deleteLearningChapter(moduleSlug, chapterId)
  }

  const extList = ALLOWED_IMAGE_EXTENSIONS.join(", ")

  return (
    <form action={formAction} className="admin-form admin-form--wide">
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />

      {mode === "create" && (
        <div className="admin-form-row">
          <div className="admin-field">
            <label htmlFor="slug">Slug URL</label>
            <input
              id="slug"
              name="slug"
              defaultValue={initial.slug ?? ""}
              placeholder="ex. panneaux-danger"
            />
            <p className="admin-hint">
              Laissez vide pour générer depuis le titre. URL : /apprendre/{moduleSlug}/…
            </p>
          </div>
          <div className="admin-field admin-field--sm">
            <label htmlFor="sortOrder">Ordre</label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={initial.sortOrder}
            />
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div className="admin-field admin-field--sm">
          <label htmlFor="sortOrder">Ordre</label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={1}
            defaultValue={initial.sortOrder}
          />
        </div>
      )}

      <div className="admin-form-section">
        <h3>Texte — Français</h3>
        <div className="admin-field">
          <label htmlFor="titleFr">Titre *</label>
          <input id="titleFr" name="titleFr" required defaultValue={initial.titleFr} />
        </div>
        <div className="admin-field">
          <label htmlFor="summaryFr">Résumé</label>
          <input id="summaryFr" name="summaryFr" defaultValue={initial.summaryFr} />
        </div>
        <div className="admin-field">
          <label htmlFor="bodyFr">Contenu de la leçon</label>
          <textarea
            id="bodyFr"
            name="bodyFr"
            rows={12}
            defaultValue={initial.bodyFr}
            placeholder="Paragraphes séparés par une ligne vide…"
          />
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Texte — Kabyle (optionnel)</h3>
        <div className="admin-field">
          <label htmlFor="titleKab">Titre</label>
          <input id="titleKab" name="titleKab" defaultValue={initial.titleKab} />
        </div>
        <div className="admin-field">
          <label htmlFor="summaryKab">Résumé</label>
          <input id="summaryKab" name="summaryKab" defaultValue={initial.summaryKab} />
        </div>
        <div className="admin-field">
          <label htmlFor="bodyKab">Contenu</label>
          <textarea id="bodyKab" name="bodyKab" rows={8} defaultValue={initial.bodyKab} />
        </div>
      </div>

      <div className="admin-form-section">
        <div className="admin-form-section-head">
          <h3>Images</h3>
          <button
            type="button"
            className="admin-btn-sm admin-btn-sm-primary"
            onClick={() =>
              setImages((prev) => [...prev, emptyImage(prev.length + 1)])
            }
          >
            <ImagePlus className="size-3.5" aria-hidden />
            Ajouter une image
          </button>
        </div>
        <p className="admin-hint">
          Placez les fichiers dans <code>public/</code> (ex.{" "}
          <code>/panneaux/A1a.svg</code>). Formats : {extList}. Taille recommandée ≤{" "}
          {RECOMMENDED_MAX_IMAGE_KB} Ko par fichier.
        </p>

        {images.length === 0 ? (
          <p className="admin-empty-inline">Aucune image — ajoutez des panneaux ou schémas.</p>
        ) : (
          <div className="admin-image-list">
            {images.map((img, index) => (
              <div key={index} className="admin-image-row">
                <div className="admin-image-preview">
                  {img.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.src}
                      alt={img.altFr || "Aperçu"}
                      width={80}
                      height={80}
                      className="admin-image-thumb"
                    />
                  ) : (
                    <div className="admin-image-thumb admin-image-thumb--empty">?</div>
                  )}
                </div>
                <div className="admin-image-fields">
                  <div className="admin-field">
                    <label>Chemin (public/)</label>
                    <input
                      value={img.src}
                      onChange={(e) => updateImage(index, { src: e.target.value }, setImages)}
                      placeholder="/panneaux/A1a.svg"
                    />
                  </div>
                  <div className="admin-form-row">
                    <div className="admin-field">
                      <label>Alt FR *</label>
                      <input
                        value={img.altFr}
                        onChange={(e) =>
                          updateImage(index, { altFr: e.target.value }, setImages)
                        }
                      />
                    </div>
                    <div className="admin-field">
                      <label>Légende FR</label>
                      <input
                        value={img.captionFr ?? ""}
                        onChange={(e) =>
                          updateImage(index, { captionFr: e.target.value }, setImages)
                        }
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--danger"
                  aria-label="Supprimer l'image"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-form-row admin-form-row--align">
        <label className="admin-checkbox">
          <input
            type="checkbox"
            name="published"
            defaultChecked={initial.published}
          />
          Publier la leçon (visible sur /apprendre)
        </label>
      </div>

      {state?.error && <p className="admin-error">{state.error}</p>}
      {state?.success && <p className="admin-success">{state.success}</p>}

      <div className="admin-form-actions">
        <SubmitButton label="Enregistrer la leçon" />
        {mode === "edit" && chapterId && (
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            disabled={deletePending}
            onClick={() => void handleDelete()}
          >
            {deletePending ? "Suppression…" : "Supprimer"}
          </button>
        )}
      </div>
    </form>
  )
}

function updateImage(
  index: number,
  patch: Partial<LearningChapterImage>,
  setImages: React.Dispatch<React.SetStateAction<LearningChapterImage[]>>,
) {
  setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)))
}
