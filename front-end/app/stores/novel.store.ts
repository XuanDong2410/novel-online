import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'
import type { Novel, NovelQuery, ApiResponse } from '~/types/novel'
import { useAuthStore } from '~/stores/auth.store'

export const useNovelsStore = defineStore('novels', () => {
  const authStore = useAuthStore()
  const runtimeConfig = useRuntimeConfig()

  // State
  const novels = ref<Novel[]>([])
  const currentNovel = ref<Novel | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Helper to get endpoint based on role
  const getEndpoint = (role: string) => {
    const roleEndpoints: Record<string, string> = {
      user: 'api/v1/user/novels',
      moderator: 'api/v2/moderator/novels',
      admin: 'api/v2/admin/novels'
    }
    return roleEndpoints[role] || roleEndpoints.user
  }

  // Actions
  const fetchNovels = async (query: NovelQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const role = authStore.user?.role || 'user'
      const endpoint = getEndpoint(role)
      console.log('Fetching novels:', { endpoint, query })
      const response = await $fetch<ApiResponse<Novel[]>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}`,
        {
          method: 'GET',
          query: {
            page: query.page || 1,
            limit: query.limit || 10,
            sort: query.sort || 'createdAt',
            direction: query.direction || 'desc'
          },
          credentials: 'include',
          timeout: 5000
        }
      )
      novels.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải danh sách truyện.'
            : err.message
          : 'Có lỗi xảy ra khi tải danh sách truyện'
      error.value = errorMessage
      console.error('Error fetching novels:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchNovelById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const role = authStore.user?.role || 'user'
      const endpoint = getEndpoint(role)
      console.log('Fetching novel by ID:', id)
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}`,
        {
          method: 'GET',
          credentials: 'include',
          timeout: 5000
        }
      )
      currentNovel.value = response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải truyện.'
            : err.message
          : 'Có lỗi xảy ra khi tải chi tiết truyện'
      error.value = errorMessage
      console.error('Error fetching novel:', err)
    } finally {
      loading.value = false
    }
  }

  const updateNovel = async (id: string, novelData: Partial<Novel>) => {
    loading.value = true
    error.value = null
    try {
      const role = authStore.user?.role || 'user'
      const endpoint = getEndpoint(role)
      console.log('Sending PATCH request for novel:', { id, novelData })
      const response = await $fetch<ApiResponse<Novel>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          body: novelData,
          timeout: 5000
        }
      )
      console.log('Update novel response:', response)
      currentNovel.value = response.data
      return response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể cập nhật truyện.'
            : `Không thể cập nhật truyện: ${err.message}`
          : 'Có lỗi xảy ra khi cập nhật truyện'
      error.value = errorMessage
      console.error('Error updating novel:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const requestEditNovel = async (id: string, message: string) => {
    try {
      const response = await $fetch<ApiResponse<null>>(`${runtimeConfig.public.apiBaseUrl}/api/v1/user/novels/${id}/request-edit`, {
        method: 'POST',
        body: { message },
        credentials: 'include',
        timeout: 5000
      })
      return response
    } catch (error) {
      console.error('Error requesting edit:', error)
      return { success: false, message: 'Failed to send edit request', data: null }
    }
  }

  const requestPublishNovel = async (id: string) => {
    try {
      const response = await $fetch<ApiResponse<null>>(`${runtimeConfig.public.apiBaseUrl}/api/v1/user/novels/${id}/request-publish`, {
        method: 'POST',
        credentials: 'include',
        timeout: 5000
      })
      return response
    } catch (error) {
      console.error('Error requesting publish:', error)
      return { success: false, message: 'Failed to send publish request' }
    }
  }

  // New moderator-specific functions
  const fetchPendingNovels = async (query: NovelQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Fetching pending novels:', { query })
      const response = await $fetch<ApiResponse<Novel[]>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/pending`,
        {
          method: 'GET',
          // query: {
          //   page: query.page || 1,
          //   limit: query.limit || 10,
          //   sort: query.sort || 'createdAt',
          //   direction: query.direction || 'desc'
          // },
          credentials: 'include',
          timeout: 5000
        }
      )
      novels.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải danh sách truyện đang chờ duyệt.'
            : err.message
          : 'Có lỗi xảy ra khi tải danh sách truyện đang chờ duyệt'
      error.value = errorMessage
      console.error('Error fetching pending novels:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchHiddenNovels = async (query: NovelQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Fetching hidden novels:', { query })
      const response = await $fetch<ApiResponse<Novel[]>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/hidden`,
        {
          method: 'GET',
          query: {
            page: query.page || 1,
            limit: query.limit || 10,
            sort: query.sort || 'createdAt',
            direction: query.direction || 'desc'
          },
          credentials: 'include',
          timeout: 5000
        }
      )
      novels.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải danh sách truyện bị ẩn.'
            : err.message
          : 'Có lỗi xảy ra khi tải danh sách truyện bị ẩn'
      error.value = errorMessage
      console.error('Error fetching hidden novels:', err)
    } finally {
      loading.value = false
    }
  }

  const warnNovelViolation = async (id: string, message: string) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Warning novel violation:', { id, message })
      const response = await $fetch<ApiResponse<null>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}/warn-violation`,
        {
          method: 'POST',
          body: { message },
          credentials: 'include',
          timeout: 5000
        }
      )
      return response
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể gửi cảnh báo vi phạm.'
            : `Không thể gửi cảnh báo vi phạm: ${err.message}`
          : 'Có lỗi xảy ra khi gửi cảnh báo vi phạm'
      error.value = errorMessage
      console.error('Error warning novel violation:', err)
      return { success: false, message: errorMessage, data: null }
    } finally {
      loading.value = false
    }
  }

  const flagNovel = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const endpoint = getEndpoint('moderator')
      console.log('Flagging novel:', { id })
      const response = await $fetch<ApiResponse<null>>(
        `${runtimeConfig.public.apiBaseUrl}/${endpoint}/${id}/flag`,
        {
          method: 'POST',
          credentials: 'include',
          timeout: 5000
        }
      )
      return response
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể đánh dấu truyện.'
            : `Không thể đánh dấu truyện: ${err.message}`
          : 'Có lỗi xảy ra khi đánh dấu truyện'
      error.value = errorMessage
      console.error('Error flagging novel:', err)
      return { success: false, message: errorMessage, data: null }
    } finally {
      loading.value = false
    }
  }

  const clearCurrentNovel = () => {
    currentNovel.value = null
  }

  const clearError = () => {
    error.value = null
  }

  // Getters
  const hasNovels = computed(() => novels.value.length > 0)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  return {
    // State
    novels,
    currentNovel,
    pagination,
    error,

    // Getters
    hasNovels,
    isLoading,
    hasError,

    // Actions
    fetchNovels,
    fetchNovelById,
    updateNovel,
    requestEditNovel,
    requestPublishNovel,

    // Mod actions
    fetchPendingNovels,
    fetchHiddenNovels,
    warnNovelViolation,
    flagNovel,
    clearCurrentNovel,
    clearError
  }
})
