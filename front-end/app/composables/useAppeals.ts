import { useAppealStore } from '~/stores/appeal.store'
import type { AppealsQuery, HandleAppealPayload, BulkHandleAppealsPayload, ExportAppealsQuery } from '~/types/appeal'

export const useAppeals = () => {
  const appealStore = useAppealStore()

  const fetchAllAppeals = async (queryParams: AppealsQuery) => {
    try {
      await appealStore.fetchAllAppeals(queryParams)
      return {
        data: appealStore.appeals,
        pending: appealStore.loading,
        error: appealStore.error
      }
    } catch (error) {
      console.error('Failed to fetch appeals:', error)
      throw error
    }
  }

  const fetchAppealById = async (appealId: string) => {
    try {
      await appealStore.fetchAppealById(appealId)
      return {
        data: appealStore.appeal,
        pending: appealStore.loading,
        error: appealStore.error
      }
    } catch (error) {
      console.error('Failed to fetch appeal:', error)
      throw error
    }
  }

  const handleAppeal = async (appealId: string, payload: HandleAppealPayload) => {
    try {
      await appealStore.handleAppeal(appealId, payload)
      return {
        data: appealStore.appeal,
        pending: appealStore.loading,
        error: appealStore.error
      }
    } catch (error) {
      console.error('Failed to handle appeal:', error)
      throw error
    }
  }

  const bulkHandleAppeals = async (payload: BulkHandleAppealsPayload) => {
    try {
      await appealStore.bulkHandleAppeals(payload)
      return {
        data: appealStore.appeals,
        pending: appealStore.loading,
        error: appealStore.error
      }
    } catch (error) {
      console.error('Failed to handle bulk appeals:', error)
      throw error
    }
  }

  const exportAppeals = async (queryParams: ExportAppealsQuery) => {
    try {
      const response = await appealStore.exportAppeals(queryParams)
      return response
    } catch (error) {
      console.error('Failed to export appeals:', error)
      throw error
    }
  }

  const fetchAppealStats = async () => {
    try {
      await appealStore.fetchAppealStats()
      return {
        data: appealStore.stats,
        pending: appealStore.loading,
        error: appealStore.error
      }
    } catch (error) {
      console.error('Failed to fetch appeal stats:', error)
      throw error
    }
  }

  return {
    appeals: appealStore.appeals,
    appeal: appealStore.appeal,
    stats: appealStore.stats,
    loading: appealStore.loading,
    error: appealStore.error,
    query: appealStore.query,
    pagination: appealStore.pagination,
    fetchAllAppeals,
    fetchAppealById,
    handleAppeal,
    bulkHandleAppeals,
    exportAppeals,
    fetchAppealStats
  }
}
