import { defineStore } from 'pinia'
import type { Appeal, AppealsQuery, AppealsResponse, AppealStats, HandleAppealPayload, BulkHandleAppealsPayload, ExportAppealsQuery } from '~/types/appeal'

export const useAppealStore = defineStore('appeals', () => {
  const API_BASE_URL = 'http://localhost:5000/api/v2/moderator/appeals'

  // State
  const appeals = ref<Appeal[]>([])
  const appeal = ref<Appeal | null>(null)
  const stats = ref<AppealStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const query = ref<AppealsQuery>({
    page: 1,
    limit: { label: '10', value: 10 },
    status: 'all',
    type: 'all',
    search: '',
    sort: 'createdAt'
  })
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Actions
  const fetchAllAppeals = async (queryParams: AppealsQuery) => {
    loading.value = true
    error.value = null
    try {
      query.value = { ...query.value, ...queryParams }
      const response = await $fetch<AppealsResponse>(API_BASE_URL, {
        method: 'GET',
        credentials: 'include',
        params: {
          page: query.value.page,
          limit: query.value.limit?.value,
          status: query.value.status !== 'all' ? query.value.status : undefined,
          type: query.value.type !== 'all' ? query.value.type : undefined,
          search: query.value.search,
          sort: query.value.sort
        }
      })
      appeals.value = response.data
      pagination.value = response.pagination
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi lấy danh sách báo cáo'
    } finally {
      loading.value = false
    }
  }

  const fetchAppealById = async (appealId: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: Appeal }>(
        `${API_BASE_URL}/${appealId}`, {
          method: 'GET',
          credentials: 'include'
        }
      )
      appeal.value = response.data
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi lấy báo cáo'
    } finally {
      loading.value = false
    }
  }

  const handleAppeal = async (appealId: string, payload: HandleAppealPayload) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: Appeal }>(
        `${API_BASE_URL}/${appealId}/handle`, {
          method: 'PATCH',
          credentials: 'include',
          body: payload
        }
      )
      // appeals.value = appeals.value.map(r => r._id === appealId ? { ...r, ...response.data } : r)
      appeal.value = response.data
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi xử lý báo cáo'
      throw err
    } finally {
      loading.value = false
    }
  }

  const bulkHandleAppeals = async (payload: BulkHandleAppealsPayload) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: Appeal }>(
        `${API_BASE_URL}/bulk-handle`, {
          method: 'PATCH',
          credentials: 'include',
          body: payload
        }
      )
      await fetchAllAppeals(query.value)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi xử lý hàng loạt báo cáo'
      throw err
    } finally {
      loading.value = false
    }
  }

  const exportAppeals = async (queryParams: ExportAppealsQuery) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<string>(`${API_BASE_URL}/export`, {
        method: 'GET',
        credentials: 'include',
        params: queryParams
      })
      return response
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi xuất báo cáo'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAppealStats = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: AppealStats }>(
        `${API_BASE_URL}/stats`, {
          method: 'GET',
          credentials: 'include'
        }
      )
      stats.value = response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi lấy thống kê báo cáo'
    } finally {
      loading.value = false
    }
  }

  return {
    appeals,
    appeal,
    stats,
    loading,
    error,
    query,
    pagination,
    fetchAllAppeals,
    fetchAppealById,
    handleAppeal,
    bulkHandleAppeals,
    exportAppeals,
    fetchAppealStats
  }
})
