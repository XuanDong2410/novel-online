import { useReportStore } from '@/stores/report.store'
import type { ReportsQuery, HandleReportPayload, BulkHandleReportsPayload, ExportReportsQuery } from '@/types/report'

export const useReports = () => {
  const reportStore = useReportStore()

  const fetchAllReports = async (query: ReportsQuery) => {
    try {
      await reportStore.fetchAllReports(query)
      return {
        data: reportStore.reports,
        pagination: reportStore.pagination,
        pending: reportStore.loading,
        error: reportStore.error,
        refresh: async () => await reportStore.fetchAllReports(query)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      throw error
    }
  }

  const fetchReportById = async (reportId: string) => {
    try {
      await reportStore.fetchReportById(reportId)
      return {
        data: reportStore.report,
        pending: reportStore.loading,
        error: reportStore.error,
        refresh: async () => await reportStore.fetchReportById(reportId)
      }
    } catch (error) {
      console.error('Failed to fetch report by ID:', error)
      throw error
    }
  }

  const handleReport = async (reportId: string, payload: HandleReportPayload) => {
    try {
      await reportStore.handleReport(reportId, payload)
      return {
        data: reportStore.report,
        pending: reportStore.loading,
        error: reportStore.error
      }
    } catch (error) {
      console.error('Failed to handle report:', error)
      throw error
    }
  }

  const bulkHandleReports = async (payload: BulkHandleReportsPayload) => {
    try {
      await reportStore.bulkHandleReports(payload)
      return {
        data: reportStore.reports,
        pending: reportStore.loading,
        error: reportStore.error
      }
    } catch (error) {
      console.error('Failed to bulk handle reports:', error)
      throw error
    }
  }

  const exportReports = async (query: ExportReportsQuery) => {
    try {
      const data = await reportStore.exportReports(query)
      return {
        data,
        pending: reportStore.loading,
        error: reportStore.error
      }
    } catch (error) {
      console.error('Failed to export reports:', error)
      throw error
    }
  }

  const fetchReportStats = async () => {
    try {
      await reportStore.fetchReportStats()
      return {
        data: reportStore.stats,
        pending: reportStore.loading,
        error: reportStore.error,
        refresh: async () => await reportStore.fetchReportStats()
      }
    } catch (error) {
      console.error('Failed to fetch report stats:', error)
      throw error
    }
  }

  return {
    fetchAllReports,
    fetchReportById,
    handleReport,
    bulkHandleReports,
    exportReports,
    fetchReportStats,
    reports: reportStore.reports,
    report: reportStore.report,
    stats: reportStore.stats,
    query: reportStore.query,
    pagination: reportStore.pagination,
    loading: reportStore.loading,
    error: reportStore.error
  }
}
