import type { ChapterSlug, ModuleSlug } from "@/lib/apprentissage/types"
import { findLessonInJson } from "@/lib/learning/json-content"

import type { ApprentissageMessages } from "./apprentissage-messages"

export type ChapterContent = {
  title: string
  summary: string
}

export type ModuleContent = {
  title: string
  subtitle: string
  description: string
  chapters: Record<string, ChapterContent>
}

export function getModuleContent(
  messages: ApprentissageMessages,
  moduleSlug: ModuleSlug,
): ModuleContent {
  return messages.modules[moduleSlug] as ModuleContent
}

export function getChapterContent(
  messages: ApprentissageMessages,
  moduleSlug: ModuleSlug,
  chapterSlug: ChapterSlug,
): ChapterContent {
  const fromProgramme = findLessonInJson(moduleSlug, chapterSlug)
  if (fromProgramme) {
    return { title: fromProgramme.title, summary: fromProgramme.summary }
  }

  const moduleContent = getModuleContent(messages, moduleSlug)
  if (moduleContent.chapters[chapterSlug]) return moduleContent.chapters[chapterSlug]

  return { title: chapterSlug, summary: "" }
}
