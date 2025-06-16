import { defineStore } from 'pinia'
import type { Chapter, ChapterQuery, ApiResponse } from '@/types/chapter'
import { useAuthStore } from '~/stores/auth.store'

export const useChapterStore = defineStore('chapters', () => {
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()

  const chapters = ref<Chapter[]>([])
  const chapter = ref<Chapter | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const getEndpoint = (role: string) => {
    const roleEndpoints: Record<string, string> = {
      user: 'api/v1/user/chapters',
      moderator: 'api/v2/moderator/chapters',
      admin: 'api/v2/admin/chapters'
    }
    return roleEndpoints[role] || roleEndpoints.user
  }

  const createChapter = async (chapterData: Chapter) => {
    loading.value = true
    error.value = null
    try {
      const role = authStore.user?.role || 'user'
      const endpoint = getEndpoint(role)
      console.log('Creating chapter with data:', { endpoint, chapterData })
      const response = await $fetch<ApiResponse<Chapter>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${chapterData.novelId}`,
        {
          method: 'POST',
          credentials: 'include',
          body: {
            title: chapterData.title,
            content: chapterData.content,
            chapterNumber: chapterData.chapterNumber,
            status: chapterData.status,
            isPublished: chapterData.isPublished
          },
          timeout: 5000
        }
      )
      console.log('Create chapter response:', response)
      chapter.value = response.data
      return response.data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo chương'
      error.value = errorMessage
      console.error('Error creating chapter:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const updateChapter = async (chapterId: string, chapterData: Chapter) => {
    loading.value = true
    error.value = null
    try {
      const role = authStore.user?.role || 'user'
      const endpoint = getEndpoint(role)
      console.log('Sending PATCH request:', {
        url: `${runtimeConfig.public.apiBaseUrl}/${endpoint}/chapter/${chapterId}`,
        body: {
          title: chapterData.title,
          content: chapterData.content,
          chapterNumber: chapterData.chapterNumber,
          status: chapterData.status,
          isPublished: chapterData.isPublished
        }
      })
      const response = await $fetch<ApiResponse<Chapter>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/chapter/${chapterId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          body: {
            title: chapterData.title,
            content: chapterData.content,
            chapterNumber: chapterData.chapterNumber,
            status: chapterData.status,
            isPublished: chapterData.isPublished
          },
          timeout: 5000
        }
      )
      console.log('Update chapter response:', response)
      chapter.value = response.data
      return response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? `Không thể cập nhật chương: ${err.message}`
          : 'Có lỗi xảy ra khi cập nhật chương'
      error.value = errorMessage
      console.error('Error updating chapter:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const fetchChaptersNovel = async (id: string, query: ChapterQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const role = authStore.user?.role || 'user'
      const endpoint = getEndpoint(role)
      console.log('Fetching chapters for novel:', { id, query })
      const response = await $fetch<ApiResponse<Chapter[]>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}`,
        {
          method: 'GET',
          credentials: 'include',
          query: {
            page: query.page || 1,
            limit: query.limit || 10,
            sort: query.sort || 'createdAt',
            direction: query.direction || 'desc'
          },
          timeout: 5000
        }
      )
      console.log('Chapter response:', response)
      chapters.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách chương'
      error.value = errorMessage
      console.error('Error fetching chapters:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchChapterById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const role = authStore.user?.role || 'user'
      const endpoint = getEndpoint(role)
      console.log('Fetching chapter by ID:', id)
      const response = await $fetch<ApiResponse<Chapter>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/chapter/${id}`,
        {
          method: 'GET',
          credentials: 'include',
          timeout: 5000
        }
      )
      console.log('Chapter by Id response:', response)
      chapter.value = response.data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải chương'
      error.value = errorMessage
      console.error('Error fetching chapter:', err)
    } finally {
      loading.value = false
    }
  }

  // New moderator-specific functions
  const fetchPendingChapters = async (query: ChapterQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Fetching pending chapters:', { query })
      const response = await $fetch<ApiResponse<Chapter[]>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/pending`,
        {
          method: 'GET',
          credentials: 'include',
          query: {
            page: query.page || 1,
            limit: query.limit || 10,
            sort: query.sort || 'createdAt',
            direction: query.direction || 'desc'
          },
          timeout: 5000
        }
      )
      console.log('Pending chapters response:', response)
      chapters.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách chương đang chờ duyệt'
      error.value = errorMessage
      console.error('Error fetching pending chapters:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchFlaggedChapters = async (query: ChapterQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Fetching flagged chapters:', { query })
      const response = await $fetch<ApiResponse<Chapter[]>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/flagged`,
        {
          method: 'GET',
          credentials: 'include',
          query: {
            page: query.page || 1,
            limit: query.limit || 10,
            sort: query.sort || 'createdAt',
            direction: query.direction || 'desc'
          },
          timeout: 5000
        }
      )
      console.log('Flagged chapters response:', response)
      chapters.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách chương bị đánh dấu'
      error.value = errorMessage
      console.error('Error fetching flagged chapters:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchWarnedChapters = async (query: ChapterQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Fetching warned chapters:', { query })
      const response = await $fetch<ApiResponse<Chapter[]>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/warned`,
        {
          method: 'GET',
          credentials: 'include',
          query: {
            page: query.page || 1,
            limit: query.limit || 10,
            sort: query.sort || 'createdAt',
            direction: query.direction || 'desc'
          },
          timeout: 5000
        }
      )
      console.log('Warned chapters response:', response)
      chapters.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách chương bị cảnh báo'
      error.value = errorMessage
      console.error('Error fetching warned chapters:', err)
    } finally {
      loading.value = false
    }
  }

  console.log('Chapter store initialized with methods:', {
    createChapter: !!createChapter,
    updateChapter: !!updateChapter,
    fetchChaptersNovel: !!fetchChaptersNovel,
    fetchChapterById: !!fetchChapterById,
    fetchPendingChapters: !!fetchPendingChapters,
    fetchFlaggedChapters: !!fetchFlaggedChapters,
    fetchWarnedChapters: !!fetchWarnedChapters
  })

  return {
    chapters,
    chapter,
    loading,
    error,
    pagination,
    createChapter,
    updateChapter,
    fetchChaptersNovel,
    fetchChapterById,

    // Mod actions
    fetchPendingChapters,
    fetchFlaggedChapters,
    fetchWarnedChapters
  }
})
