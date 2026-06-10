export type LearningChapterImage = {
  src: string
  altFr: string
  altKab?: string
  captionFr?: string
  captionKab?: string
  sortOrder: number
}

export type LessonContentDto = {
  title: string
  summary: string
  body: string | null
  images: LearningChapterImage[]
  published: boolean
}

export type AdminChapterRow = {
  id: string
  slug: string
  sortOrder: number
  titleFr: string
  summaryFr: string | null
  published: boolean
  updatedAt: Date
}

export type AdminModuleRow = {
  id: string
  slug: string
  step: number
  titleFr: string
  subtitleFr: string | null
  descriptionFr: string | null
  published: boolean
  chapters: AdminChapterRow[]
}
