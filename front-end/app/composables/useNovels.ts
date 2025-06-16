import { computed } from 'vue'
import { useNovelsStore } from '~/stores/novel.store'
import type { Novel, NovelQuery } from '~/types/novel'

export const useNovels = () => {
  const novelsStore = useNovelsStore()

  const fetchNovels = async (query: NovelQuery = {}) => {
    await novelsStore.fetchNovels(query)
    return {
      data: computed(() => novelsStore.novels),
      pagination: computed(() => novelsStore.pagination),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error),
      refresh: async () => await novelsStore.fetchNovels(query)
    }
  }

  const fetchNovelById = async (id: string) => {
    await novelsStore.fetchNovelById(id)
    return {
      data: computed(() => novelsStore.currentNovel),
      message: computed(() => novelsStore.error || ''),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error),
      refresh: async () => await novelsStore.fetchNovelById(id)
    }
  }

  const updateNovel = async (id: string, novelData: Partial<Novel>) => {
    await novelsStore.updateNovel(id, novelData)
    return {
      data: computed(() => novelsStore.currentNovel),
      message: computed(() => novelsStore.error || ''),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error)
    }
  }

  const requestEdit = async (novelId: string, message: string) => {
    await novelsStore.requestEditNovel(novelId, message)
    return {
      message: computed(() => novelsStore.error || ''),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error)
    }
  }

  const requestPublish = async (novelId: string) => {
    await novelsStore.requestPublishNovel(novelId)
    return {
      message: computed(() => novelsStore.error || ''),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error)
    }
  }

  // New moderator-specific functions
  const fetchPendingNovels = async (query: NovelQuery = {}) => {
    await novelsStore.fetchPendingNovels(query)
    return {
      data: computed(() => novelsStore.novels),
      pagination: computed(() => novelsStore.pagination),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error),
      refresh: async () => await novelsStore.fetchPendingNovels(query)
    }
  }

  const fetchHiddenNovels = async (query: NovelQuery = {}) => {
    await novelsStore.fetchHiddenNovels(query)
    return {
      data: computed(() => novelsStore.novels),
      pagination: computed(() => novelsStore.pagination),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error),
      refresh: async () => await novelsStore.fetchHiddenNovels(query)
    }
  }

  const warnNovelViolation = async (novelId: string, message: string) => {
    await novelsStore.warnNovelViolation(novelId, message)
    return {
      message: computed(() => novelsStore.error || ''),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error)
    }
  }

  const flagNovel = async (novelId: string) => {
    await novelsStore.flagNovel(novelId)
    return {
      message: computed(() => novelsStore.error || ''),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error)
    }
  }

  return {
    fetchNovels,
    fetchNovelById,
    updateNovel,
    requestEdit,
    requestPublish,

    // Mod
    fetchPendingNovels,
    fetchHiddenNovels,
    warnNovelViolation,
    flagNovel
  }
}
