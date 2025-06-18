import type { statusPublish } from '@/types'

export type ColorType = 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'error' | 'neutral'

export const useStatus = () => {
  const getStatusLabel = (status: statusPublish): string => {
    const statusLabels: Record<string, string> = {
      pending: 'Đang chờ',
      draft: 'Bản nháp',
      editing: 'Cần chỉnh sửa',
      warning: 'Cảnh báo',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      retracted: 'Đã rút lại'
    }
    return statusLabels[status] || status
  }
  const getStatusColor = (status: statusPublish): ColorType => {
    const statusColors: Record<string, ColorType> = {
      pending: 'secondary',
      draft: 'neutral',
      editing: 'info',
      warning: 'warning',
      approved: 'success',
      rejected: 'error',
      retracted: 'neutral'
    }
    return statusColors[status] || 'neutral'
  }
  const getStatusIcon = (status: statusPublish): string => {
    const statusIcons: Record<string, string> = {
      pending: 'i-heroicons-clock',
      draft: 'i-heroicons-document-text',
      editing: 'i-heroicons-pencil',
      warning: 'i-heroicons-exclamation-triangle',
      approved: 'i-heroicons-check-circle',
      rejected: 'i-heroicons-x-circle',
      retracted: 'i-heroicons-ban'
    }
    return statusIcons[status] || 'i-heroicons-question-mark-circle'
  }
  return {
    getStatusLabel,
    getStatusColor,
    getStatusIcon
  }
}
