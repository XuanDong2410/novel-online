import { defineStore } from 'pinia'
import type { ModerationLog, LogsQuery, LogsResponse, LogStats } from '~/types/log'
// import { useAuthStore } from '~/stores/auth.store'

export const useLogStore = defineStore('logs', () => {
  // const authStore = useAuthStore()
  const API_BASE_URL = 'http://localhost:5000/api/v2/admin/logs' // Cần cấu hình proxy trong nuxt.config.ts nếu gọi API backend
  // const runtimeConfig = useRuntimeConfig()

  // State
  const logs = ref<ModerationLog[]>([])
  const stats = ref<LogStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const query = ref<LogsQuery>({
    page: 1,
    limit: { label: '10', value: 10 }
  })
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Actions
  const fetchAllLogs = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<LogsResponse>(API_BASE_URL, {
        method: 'GET',
        credentials: 'include',
        params: query.value
      })
      logs.value = response.data
      pagination.value = response.pagination
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải danh sách logs'
            : err.message
          : 'Lỗi khi lấy danh sách logs'
      error.value = errorMessage
    } finally {
      loading.value = false
    }
  }

  const fetchLogById = async (logId: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: ModerationLog }>(
        `${API_BASE_URL}/${logId}`, {
          method: 'GET',
          credentials: 'include'
        }
      )
      return response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải chi tiết log'
            : err.message
          : 'Lỗi khi lấy chi tiết log'
      error.value = errorMessage
    } finally {
      loading.value = false
    }
  }

  const fetchLogStats = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: LogStats }>(
        `${API_BASE_URL}/stats`, {
          method: 'GET',
          credentials: 'include'
        }
      )
      stats.value = response.data
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể tải thống kê logs'
            : err.message
          : 'Lỗi khi lấy thống kê logs'
      error.value = errorMessage
    } finally {
      loading.value = false
    }
  }

  const deleteLogById = async (logId: string) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${API_BASE_URL}/${logId}`, { method: 'DELETE' })
      await fetchAllLogs()
      await fetchLogStats()
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể xóa logs'
            : err.message
          : 'Lỗi khi xóa logs'
      error.value = errorMessage
    } finally {
      loading.value = false
    }
  }

  const deleteAllLogs = async () => {
    loading.value = true
    error.value = null
    try {
      await $fetch(API_BASE_URL, { method: 'DELETE' })
      logs.value = []
      pagination.value = { page: 1, limit: 10, total: 0, totalPages: 0 }
      await fetchLogStats()
    } catch (err: unknown) {
      const errorMessage
        = err instanceof Error
          ? err.message.includes('CORS')
            ? 'Lỗi CORS: Không thể xóa tất cả logs'
            : err.message
          : 'Lỗi khi xóa tất cả logs'
      error.value = errorMessage
    } finally {
      loading.value = false
    }
  }

  const setQuery = (queryParams: Partial<LogsQuery>) => {
    query.value = { ...query.value, ...queryParams }
  }

  const clearLogs = () => {
    logs.value = []
    pagination.value = { page: 1, limit: 10, total: 0, totalPages: 0 }
  }

  // Computed properties
  const getLogs = computed(() => logs.value)
  const getStats = computed(() => stats.value)
  const getQuery = computed(() => query.value)
  const getPagination = computed(() => pagination.value)
  const isLoading = computed(() => loading.value)
  const getError = computed(() => error.value)

  return {
    // State
    logs,
    stats,
    query,
    pagination,
    error,

    // Computed
    getLogs,
    getStats,
    getQuery,
    getPagination,
    isLoading,
    getError,

    // Actions
    fetchAllLogs,
    fetchLogById,
    fetchLogStats,
    deleteLogById,
    deleteAllLogs,
    setQuery,
    clearLogs
  }
})
