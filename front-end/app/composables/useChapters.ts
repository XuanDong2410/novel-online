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

  const fetchChapters = async (id: string) => {
    await chaptersStore.fetchChaptersNovel(id)
    return {
      data: computed(() => chaptersStore.chapters),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error),
      refresh: async () => await chaptersStore.fetchChaptersNovel(id)
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
  const fetchModeratorChapterById = async (chapterId: string) => {
    await chaptersStore.fetchModeratorChapterById(chapterId)
    return {
      data: computed(() => chaptersStore.chapter),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error)
    }
  }
  const chapterActions = async (chapterId: string, type: string, note: string) => {
    await chaptersStore.chapterActions(chapterId, type, note)
    return {
      message: computed(() => chaptersStore.error || note),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error),
      refresh: async () => await chaptersStore.getChapterById(chapterId)
    }
  }

  const getChaptersByNovelId = async (novelId: string) => {
    await chaptersStore.getChaptersByNovelId(novelId)
    return {
      data: computed(() => chaptersStore.chapters),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error),
      refresh: async () => await chaptersStore.getChaptersByNovelId(novelId)
    }
  }
  const getChapterById = async (id: string) => {
    await chaptersStore.getChapterById(id)
    return {
      data: computed(() => chaptersStore.chapter),
      message: computed(() => chaptersStore.error || ''),
      pending: computed(() => chaptersStore.loading),
      error: computed(() => chaptersStore.error),
      refresh: async () => await chaptersStore.getChapterById(id)
    }
  }
  return {
    // ALL ROLES
    getChaptersByNovelId,
    getChapterById,

    fetchChapters,
    fetchChapter,
    createChapter,
    updateChapter,

    // Mod
    fetchPendingChapters,
    fetchFlaggedChapters,
    fetchWarnedChapters,
    chapterActions,
    fetchModeratorChapterById
  }
}
