import type { ChapterSlug, ModuleSlug } from "@/lib/apprentissage/types"

import type { ApprentissageMessages } from "./apprentissage-messages"

export type ChapterContent = {
  title: string
  summary: string
}

export function getModuleContent(
  messages: ApprentissageMessages,
  moduleSlug: ModuleSlug,
) {
  return messages.modules[moduleSlug]
}

export function getChapterContent(
  messages: ApprentissageMessages,
  moduleSlug: ModuleSlug,
  chapterSlug: ChapterSlug,
): ChapterContent {
  const chapters = messages.modules[moduleSlug].chapters as Record<
    ChapterSlug,
    ChapterContent
  >
  return chapters[chapterSlug]
}
