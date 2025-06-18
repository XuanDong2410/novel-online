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
  const fetchNovelWithChapters = async (novelId: string) => {
    await novelsStore.fetchNovelWithChapters(novelId)
    console.log('Data novel in composable: ', novelsStore.currentNovel)
    return {
      data: computed(() => novelsStore.currentNovel),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error),
      refresh: async () => await novelsStore.fetchNovelWithChapters(novelId)
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

  // ALL ROLES
  const getNovelById = async (id: string) => {
    await novelsStore.getNovelById(id)
    return {
      data: computed(() => novelsStore.currentNovel),
      pending: computed(() => novelsStore.isLoading),
      error: computed(() => novelsStore.error),
      refresh: async () => await novelsStore.getNovelById(id)
    }
  }
  return {

    // ALL ROLES
    getNovelById,

    fetchNovels,
    fetchNovelById,
    updateNovel,
    requestEdit,
    requestPublish,

    // Mod
    fetchPendingNovels,
    fetchNovelWithChapters,
    fetchHiddenNovels,
    warnNovelViolation,
    flagNovel
  }
}
