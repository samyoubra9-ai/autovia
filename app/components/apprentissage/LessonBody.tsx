import Image from "next/image"

import type { LearningChapterImage } from "@/lib/learning/types"

type LessonBodyProps = {
  body: string | null
  images: LearningChapterImage[]
  placeholder?: string
}

export function LessonBody({ body, images, placeholder }: LessonBodyProps) {
  const paragraphs = body
    ?.split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  const hasContent =
    (paragraphs && paragraphs.length > 0) || images.length > 0

  if (!hasContent) {
    if (!placeholder) return null
    return (
      <div className="ap-lesson-empty">
        <p>{placeholder}</p>
      </div>
    )
  }

  return (
    <article className="ap-lesson-body">
      {paragraphs?.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}

      {images.map((img) => (
        <figure key={`${img.src}-${img.sortOrder}`} className="ap-lesson-figure">
          <div className="ap-lesson-figure-media">
            <Image
              src={img.src}
              alt={img.altFr}
              width={320}
              height={320}
              className="ap-lesson-figure-img"
              unoptimized={img.src.endsWith(".svg")}
            />
          </div>
          {img.captionFr ? (
            <figcaption className="ap-lesson-figure-caption">{img.captionFr}</figcaption>
          ) : null}
        </figure>
      ))}
    </article>
  )
}
