import type { statusPublish } from '@/types'

export type ColorType = 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'error' | 'neutral'
export interface StatusAction {
  label: string
  variant: 'solid' | 'outline'
  icon: string
  key?: string
  click?: () => void
}
export interface StatusConfig {
  color: string
  icon: string
  title: string
  actions: StatusAction[]
}
export const useStatus = () => {
  const { openActionModal } = useModalActionHandler()
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

  const statusMap: Record<statusPublish, StatusConfig> = {
    draft: {
      color: 'neutral',
      icon: 'i-heroicons-pencil-square',
      title: 'Chương đang là bản nháp',
      actions: [
        { label: 'Chỉnh sửa', variant: 'outline', icon: 'i-heroicons-pencil', click: () => openActionModal({ label: 'Chỉnh sửa', variant: 'outline', icon: 'i-heroicons-pencil' }) }
      ]
    },
    editing: {
      color: 'warning',
      icon: 'i-heroicons-cog',
      title: 'Chương đang chỉnh sửa',
      actions: [
        { label: 'Tiếp tục chỉnh sửa', variant: 'solid', icon: 'i-heroicons-pencil', click: () => openActionModal({ label: 'Tiếp tục chỉnh sửa', variant: 'solid', icon: 'i-heroicons-pencil' }) }
      ]
    },
    pending: {
      color: 'info',
      icon: 'i-heroicons-clock',
      title: 'Chương đang chờ kiểm duyệt',
      actions: [
        { label: 'Gửi yêu cầu sửa', variant: 'outline', icon: 'i-heroicons-arrow-path', key: 'requestEdit', click: () => openActionModal({ label: 'Gửi yêu cầu sửa', variant: 'outline', icon: 'i-heroicons-arrow-path', key: 'requestEdit' }) }
      ]
    },
    approved: {
      color: 'success',
      icon: 'i-heroicons-check-circle',
      title: 'Chương đã được xuất bản',
      actions: [
        { label: 'Yêu cầu chỉnh sửa', variant: 'outline', icon: 'i-heroicons-pencil', key: 'requestEdit', click: () => openActionModal({ label: 'Yêu cầu chỉnh sửa', variant: 'outline', icon: 'i-heroicons-pencil', key: 'requestEdit' }) }
      ]
    },
    rejected: {
      color: 'error',
      icon: 'i-heroicons-x-circle',
      title: 'Chương bị từ chối',
      actions: [
        { label: 'Kháng cáo', variant: 'solid', icon: 'i-heroicons-megaphone', key: 'appeal', click: () => openActionModal({ label: 'Kháng cáo', variant: 'solid', icon: 'i-heroicons-megaphone', key: 'appeal' }) }
      ]
    },
    warning: {
      color: 'warning',
      icon: 'i-heroicons-exclamation-triangle',
      title: 'Chương có cảnh báo vi phạm',
      actions: [
        { label: 'Kháng cáo', variant: 'solid', icon: 'i-heroicons-megaphone', key: 'appeal', click: () => openActionModal({ label: 'Kháng cáo', variant: 'solid', icon: 'i-heroicons-megaphone', key: 'appeal' }) }
      ]
    },
    retracted: {
      color: 'neutral',
      icon: 'i-heroicons-arrow-uturn-left',
      title: 'Chương đã thu hồi',
      actions: [
        { label: 'Gửi lại', variant: 'outline', icon: 'i-heroicons-paper-airplane', click: () => openActionModal({ label: 'Gửi lại', variant: 'outline', icon: 'i-heroicons-paper-airplane', key: 'resubmit' }) }
      ]
    }
  }

  const useChapterStatus = (status: statusPublish): StatusConfig => {
    return statusMap[status]
  }
  return {
    useChapterStatus,
    getStatusLabel,
    getStatusColor,
    getStatusIcon
  }
}
