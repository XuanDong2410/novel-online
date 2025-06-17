import { useLogStore } from '@/stores/log.store'
import type { ModerationAction, LogsQuery } from '@/types/log'

export const useLogs = () => {
  const logStore = useLogStore()
  // const getActionColor = (action: ModerationAction): string => {
  //   const actionColors: Record<string, string> = {
  //     APPROVE: 'success',
  //     APPROVE_CHAPTER: 'success',
  //     REJECT: 'error',
  //     REJECT_CHAPTER: 'error',
  //     DELETE_NOVEL: 'error',
  //     DELETE_CHAPTER: 'error',
  //     SUSPEND_USER: 'orange',
  //     UNSUSPEND_USER: 'blue',
  //     BAN_USER: 'red',
  //     UNBAN_USER: 'green',
  //     WARN_USER: 'yellow',
  //     SYSTEM_AUTO_REJECT: 'gray',
  //     SYSTEM_AUTO_APPROVE: 'gray'
  //   }
  //   return actionColors[action] || 'gray'
  // }

  // const getActionText = (action: ModerationAction): string => {
  //   const actionTexts: Record<string, string> = {
  //     APPROVE_NOVEL: 'Duyệt truyện',
  //     APPROVE_CHAPTER: 'Duyệt chương',
  //     REJECT_NOVEL: 'Từ chối truyện',
  //     REJECT_CHAPTER: 'Từ chối chương',
  //     DELETE_NOVEL: 'Xóa truyện',
  //     DELETE_CHAPTER: 'Xóa chương',
  //     SUSPEND_USER: 'Tạm khóa người dùng',
  //     UNSUSPEND_USER: 'Mở khóa người dùng',
  //     BAN_USER: 'Cấm người dùng',
  //     UNBAN_USER: 'Bỏ cấm người dùng',
  //     WARN_USER: 'Cảnh báo người dùng',
  //     SYSTEM_AUTO_REJECT: 'Hệ thống tự động từ chối',
  //     SYSTEM_AUTO_APPROVE: 'Hệ thống tự động duyệt'
  //   }
  //   return actionTexts[action] || 'Hành động không xác định'
  // }

  // const getActionIcon = (action: ModerationAction): string => {
  //   const actionIcons: Record<string, string> = {
  //     APPROVE_NOVEL: 'i-lucide-check-circle',
  //     APPROVE_CHAPTER: 'i-lucide-check-circle',
  //     REJECT_NOVEL: 'i-lucide-x-circle',
  //     REJECT_CHAPTER: 'i-lucide-x-circle',
  //     DELETE_NOVEL: 'i-lucide-trash-2',
  //     DELETE_CHAPTER: 'i-lucide-trash-2',
  //     SUSPEND_USER: 'i-lucide-user-x',
  //     UNSUSPEND_USER: 'i-lucide-user-check',
  //     BAN_USER: 'i-lucide-ban',
  //     UNBAN_USER: 'i-lucide-user-plus',
  //     WARN_USER: 'i-lucide-alert-triangle',
  //     SYSTEM_AUTO_REJECT: 'i-lucide-bot',
  //     SYSTEM_AUTO_APPROVE: 'i-lucide-bot'
  //   }
  //   return actionIcons[action] || 'i-lucide-activity'
  // }

  const getActionText = (action: ModerationAction): string => {
    const actionTexts: Record<string, string> = {
      APPROVE_NOVEL: 'Duyệt truyện',
      REJECT_NOVEL: 'Từ chối truyện',
      APPROVE_CHAPTER: 'Duyệt chương',
      REJECT_CHAPTER: 'Từ chối chương',
      DELETE_NOVEL: 'Xóa truyện',
      DELETE_CHAPTER: 'Xóa chương',
      SUSPEND_USER: 'Tạm khóa người dùng',
      UNSUSPEND_USER: 'Mở khóa người dùng',
      BAN_USER: 'Cấm người dùng',
      UNBAN_USER: 'Bỏ cấm người dùng',
      WARN_USER: 'Cảnh báo người dùng',
      SYSTEM_AUTO_REJECT: 'Hệ thống tự động từ chối',
      SYSTEM_AUTO_APPROVE: 'Hệ thống tự động duyệt',
      notice: 'Thông báo',
      userNotice: 'Thông báo người dùng',
      requestEdit: 'Yêu cầu chỉnh sửa',
      approve: 'Duyệt',
      reject: 'Từ chối',
      warning: 'Cảnh báo',
      ban: 'Cấm',
      unBan: 'Bỏ cấm',
      flag: 'Gắn cờ',
      hide: 'Ẩn',
      unHide: 'Bỏ ẩn',
      systemBan: 'Hệ thống cấm',
      systemFlag: 'Hệ thống gắn cờ',
      systemNotice: 'Thông báo hệ thống',
      userReport: 'Báo cáo người dùng',
      userAppeal: 'Kháng cáo người dùng'
    }
    return actionTexts[action] || action
  }

  const getActionColor = (action: ModerationAction): string => {
    const actionColors: Record<string, string> = {
      APPROVE_NOVEL: 'green',
      APPROVE_CHAPTER: 'green',
      approve: 'green',
      REJECT_NOVEL: 'red',
      REJECT_CHAPTER: 'red',
      reject: 'red',
      DELETE_NOVEL: 'red',
      DELETE_CHAPTER: 'red',
      SUSPEND_USER: 'orange',
      BAN_USER: 'red',
      ban: 'red',
      UNSUSPEND_USER: 'green',
      UNBAN_USER: 'green',
      unBan: 'green',
      WARN_USER: 'yellow',
      warning: 'yellow',
      SYSTEM_AUTO_REJECT: 'gray',
      SYSTEM_AUTO_APPROVE: 'gray',
      notice: 'blue',
      userNotice: 'blue',
      requestEdit: 'orange',
      flag: 'orange',
      hide: 'gray',
      unHide: 'green',
      systemBan: 'red',
      systemFlag: 'orange',
      systemNotice: 'blue',
      userReport: 'red',
      userAppeal: 'blue'
    }
    return actionColors[action] || 'gray'
  }

  const getActionIcon = (action: ModerationAction): string => {
    const actionIcons: Record<string, string> = {
      APPROVE_NOVEL: 'i-lucide-check-circle',
      APPROVE_CHAPTER: 'i-lucide-check-circle',
      approve: 'i-lucide-check-circle',
      REJECT_NOVEL: 'i-lucide-x-circle',
      REJECT_CHAPTER: 'i-lucide-x-circle',
      reject: 'i-lucide-x-circle',
      DELETE_NOVEL: 'i-lucide-trash-2',
      DELETE_CHAPTER: 'i-lucide-trash-2',
      SUSPEND_USER: 'i-lucide-pause-circle',
      BAN_USER: 'i-lucide-slash',
      ban: 'i-lucide-slash',
      UNSUSPEND_USER: 'i-lucide-play-circle',
      UNBAN_USER: 'i-lucide-circle',
      unBan: 'i-lucide-circle',
      WARN_USER: 'i-lucide-alert-triangle',
      warning: 'i-lucide-alert-triangle',
      SYSTEM_AUTO_REJECT: 'i-lucide-cpu',
      SYSTEM_AUTO_APPROVE: 'i-lucide-cpu',
      notice: 'i-lucide-bell',
      userNotice: 'i-lucide-message-square',
      requestEdit: 'i-lucide-edit',
      flag: 'i-lucide-flag',
      hide: 'i-lucide-eye-off',
      unHide: 'i-lucide-eye',
      systemBan: 'i-lucide-shield-x',
      systemFlag: 'i-lucide-flag-triangle-right',
      systemNotice: 'i-lucide-bell-ring',
      userReport: 'i-lucide-alert-octagon',
      userAppeal: 'i-lucide-help-circle'
    }
    return actionIcons[action] || 'i-lucide-help-circle'
  }
  const fetchAllLogs = async () => {
    try {
      await logStore.fetchAllLogs()
      return {
        data: computed(() => logStore.logs),
        pagination: computed(() => logStore.pagination),
        pending: computed(() => logStore.isLoading),
        error: computed(() => logStore.error),
        refresh: async () => await logStore.fetchAllLogs()
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      throw error
    }
  }

  const fetchLogById = async (logId: string) => {
    try {
      return await logStore.fetchLogById(logId)
    } catch (error) {
      console.error('Failed to fetch log by ID:', error)
      throw error
    }
  }

  const fetchLogStats = async () => {
    try {
      await logStore.fetchLogStats()
      return {
        data: computed(() => logStore.stats),
        pagination: computed(() => logStore.pagination),
        pending: computed(() => logStore.isLoading),
        error: computed(() => logStore.error),
        refresh: async () => await logStore.fetchAllLogs()
      }
    } catch (error) {
      console.error('Failed to fetch log stats:', error)
      throw error
    }
  }

  const deleteLogById = async (logId: string) => {
    try {
      await logStore.deleteLogById(logId)
    } catch (error) {
      console.error('Failed to delete log:', error)
      throw error
    }
  }

  const deleteAllLogs = async () => {
    try {
      await logStore.deleteAllLogs()
    } catch (error) {
      console.error('Failed to delete all logs:', error)
      throw error
    }
  }

  return {
    logs: computed(() => logStore.getLogs),
    stats: computed(() => logStore.getStats),
    query: computed(() => logStore.getQuery),
    pagination: computed(() => logStore.getPagination),
    loading: computed(() => logStore.isLoading),
    error: computed(() => logStore.getError),

    getActionColor,
    getActionText,
    getActionIcon,

    fetchAllLogs,
    fetchLogById,
    fetchLogStats,
    deleteLogById,
    deleteAllLogs,
    setQuery: (queryParams: Partial<LogsQuery>) => logStore.setQuery(queryParams)
  }
}
