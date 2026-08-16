import type { LearningChapterImage } from "@/lib/learning/types"

export type ProgrammeLesson = {
  slug: string
  code: string
  title: string
  summary: string
  body?: string | null
  bodyKab?: string | null
  images?: LearningChapterImage[]
  published?: boolean
}

export type ProgrammeSection = {
  slug: string
  code: string
  title: string
  lessons: ProgrammeLesson[]
}

export type ProgrammeChapitreJson = {
  slug: string
  step: number
  title: string
  subtitle: string
  description: string
  quizSlug: string
  sections: ProgrammeSection[]
}
