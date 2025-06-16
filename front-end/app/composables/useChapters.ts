import { computed } from 'vue'
import { useChapterStore } from '~/stores/chapter.store'
import type { Chapter, ChapterQuery } from '~/types/chapter'

export const useChapters = () => {
  const chaptersStore = useChapterStore()

  console.log('useChapters initialized with store methods:', {
    createChapter: !!chaptersStore.createChapter,
    updateChapter: !!chaptersStore.updateChapter,
    fetchChaptersNovel: !!chaptersStore.fetchChaptersNovel,
    fetchChapterById: !!chaptersStore.fetchChapterById,
    fetchPendingChapters: !!chaptersStore.fetchPendingChapters,
    fetchFlaggedChapters: !!chaptersStore.fetchFlaggedChapters,
    fetchWarnedChapters: !!chaptersStore.fetchWarnedChapters
  })

  const fetchChapters = async (id: string, query: ChapterQuery = {}) => {
    await chaptersStore.fetchChaptersNovel(id, query)
    return {
      data: computed(() => chaptersStore.chapters),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error),
      refresh: async () => await chaptersStore.fetchChaptersNovel(id, query)
    }
  }

  const fetchChapter = async (id: string) => {
    await chaptersStore.fetchChapterById(id)
    return {
      data: computed(() => chaptersStore.chapter),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error),
      refresh: async () => await chaptersStore.fetchChapterById(id)
    }
  }

  const createChapter = async (chapter: Chapter) => {
    await chaptersStore.createChapter(chapter)
    return {
      data: computed(() => chaptersStore.chapter),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error)
    }
  }

  const updateChapter = async (chapterId: string, chapter: Chapter) => {
    await chaptersStore.updateChapter(chapterId, chapter)
    return {
      data: computed(() => chaptersStore.chapter),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error)
    }
  }

  // New moderator-specific functions
  const fetchPendingChapters = async (query: ChapterQuery = {}) => {
    await chaptersStore.fetchPendingChapters(query)
    return {
      data: computed(() => chaptersStore.chapters),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error),
      refresh: async () => await chaptersStore.fetchPendingChapters(query)
    }
  }

  const fetchFlaggedChapters = async (query: ChapterQuery = {}) => {
    await chaptersStore.fetchFlaggedChapters(query)
    return {
      data: computed(() => chaptersStore.chapters),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error),
      refresh: async () => await chaptersStore.fetchFlaggedChapters(query)
    }
  }

  const fetchWarnedChapters = async (query: ChapterQuery = {}) => {
    await chaptersStore.fetchWarnedChapters(query)
    return {
      data: computed(() => chaptersStore.chapters),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error),
      refresh: async () => await chaptersStore.fetchWarnedChapters(query)
    }
  }

  return {
    fetchChapters,
    fetchChapter,
    createChapter,
    updateChapter,

    // Mod
    fetchPendingChapters,
    fetchFlaggedChapters,
    fetchWarnedChapters
  }
}
