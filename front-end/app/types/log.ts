export interface ModerationLog {
  _id: string
  novelId?: {
    _id: string
    title: string
  }
  chapterId?: {
    _id: string
    title: string
    chapterNumber: number
  }
  moderator?: {
    _id: string
    username: string
    email: string
  }
  action: ModerationAction
  note?: string
  details?: Record<string, string | number | boolean | null>
  isSystemAction: boolean
  createdAt: string
  updatedAt: string
}
// ~/types/log.ts
export enum ModerationAction {
  APPROVE_NOVEL = 'APPROVE_NOVEL',
  REJECT_NOVEL = 'REJECT_NOVEL',
  APPROVE_CHAPTER = 'APPROVE_CHAPTER',
  REJECT_CHAPTER = 'REJECT_CHAPTER',
  SUSPEND_USER = 'SUSPEND_USER',
  UNSUSPEND_USER = 'UNSUSPEND_USER',
  DELETE_NOVEL = 'DELETE_NOVEL',
  DELETE_CHAPTER = 'DELETE_CHAPTER',
  WARN_USER = 'WARN_USER',
  BAN_USER = 'BAN_USER',
  UNBAN_USER = 'UNBAN_USER',
  SYSTEM_AUTO_REJECT = 'SYSTEM_AUTO_REJECT',
  SYSTEM_AUTO_APPROVE = 'SYSTEM_AUTO_APPROVE',
  notice = 'NOTICE',
  userNotice = 'USER_NOTICE',
  requestEdit = 'REQUEST_EDIT',
  approve = 'APPROVE',
  reject = 'REJECT',
  warning = 'WARNING',
  ban = 'BAN',
  unBan = 'UN_BAN',
  flag = 'FLAG',
  hide = 'HIDE',
  unHide = 'UN_HIDE',
  systemBan = 'SYSTEM_BAN',
  systemFlag = 'SYSTEM_FLAG',
  systemNotice = 'SYSTEM_NOTICE',
  userReport = 'USER_REPORT',
  userAppeal = 'USER_APPEAL'
}

export interface LogsQuery {
  page?: number
  limit?: { label: string, value: number }
  action?: { label: ModerationAction, value: ModerationAction }
  moderator?: string
  novelId?: string
  isSystemAction?: { label: string, value: boolean }
  startDate?: string
  endDate?: string
  search?: string
}

export interface LogsResponse {
  success: boolean
  message: string
  data: ModerationLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LogStats {
  totalLogs: number
  todayLogs: number
  systemActions: number
  manualActions: number
  actionBreakdown: Record<ModerationAction, number>
  moderatorStats: Array<{
    moderator: {
      _id: string
      username: string
    }
    count: number
  }>
}
