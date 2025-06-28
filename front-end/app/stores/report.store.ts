import { defineStore } from 'pinia'
import type { Report, ReportsQuery, ReportsResponse, ReportStats, HandleReportPayload, BulkHandleReportsPayload, ExportReportsQuery } from '~/types/report'

export const useReportStore = defineStore('reports', () => {
  const API_BASE_URL = 'http://localhost:5000/api/v2/moderator/reports'

  // State
  const reports = ref<Report[]>([])
  const report = ref<Report | null>(null)
  const stats = ref<ReportStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const query = ref<ReportsQuery>({
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
  const fetchAllReports = async (queryParams: ReportsQuery) => {
    loading.value = true
    error.value = null
    try {
      query.value = { ...query.value, ...queryParams }
      const response = await $fetch<ReportsResponse>(API_BASE_URL, {
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
      reports.value = response.data
      pagination.value = response.pagination
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi lấy danh sách báo cáo'
    } finally {
      loading.value = false
    }
  }

  const fetchReportById = async (reportId: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: Report }>(
        `${API_BASE_URL}/${reportId}`, {
          method: 'GET',
          credentials: 'include'
        }
      )
      report.value = response.data
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi lấy báo cáo'
    } finally {
      loading.value = false
    }
  }

  const handleReport = async (reportId: string, payload: HandleReportPayload) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: Report }>(
        `${API_BASE_URL}/${reportId}/handle`, {
          method: 'PATCH',
          credentials: 'include',
          body: payload
        }
      )
      // reports.value = reports.value.map(r => r._id === reportId ? { ...r, ...response.data } : r)
      report.value = response.data
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi xử lý báo cáo'
      throw err
    } finally {
      loading.value = false
    }
  }

  const bulkHandleReports = async (payload: BulkHandleReportsPayload) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: Report }>(
        `${API_BASE_URL}/bulk-handle`, {
          method: 'PATCH',
          credentials: 'include',
          body: payload
        }
      )
      await fetchAllReports(query.value)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi xử lý hàng loạt báo cáo'
      throw err
    } finally {
      loading.value = false
    }
  }

  const exportReports = async (queryParams: ExportReportsQuery) => {
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

  const fetchReportStats = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, message: string, data: ReportStats }>(
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
    reports,
    report,
    stats,
    loading,
    error,
    query,
    pagination,
    fetchAllReports,
    fetchReportById,
    handleReport,
    bulkHandleReports,
    exportReports,
    fetchReportStats
  }
})
