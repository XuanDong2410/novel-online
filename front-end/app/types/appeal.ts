import type { User } from '~/types/user'

export interface Appeal {
  _id: string
  user: User
  novelId?: string
  chapterId?: string
  actionType: 'reject' | 'warning' | 'flag' | 'hide'
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'deleted'
  handledBy?: User
  responseMessage?: string
  handledAt?: Date
  createdAt: Date
}

export interface AppealsQuery {
  page?: number
  limit?: { label: string, value: number }
  status?: 'all' | 'pending' | 'reviewed' | 'rejected'
  type?: 'all' | 'Rate' | 'Novel' | 'Chapter'
  search?: string
  sort?: 'createdAt' | 'createdAt_asc' | 'priority'
}

export interface AppealsResponse {
  success: boolean
  message: string
  data: Appeal[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AppealStats {
  total: number
  pending: number
  reviewed: number
  rejected: number
  byType: Record<string, number>
}

export interface HandleAppealPayload {
  status: 'reviewed' | 'rejected'
  note?: string
  action?: 'approve' | 'reject' | 'flag' | 'hide' | 'warning'
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export interface BulkHandleAppealsPayload {
  appealIds: string[]
  action: 'approve_all' | 'reject_all' | 'flag_all' | 'hide_all'
  severity: 'low' | 'medium' | 'high' | 'critical'
  note?: string
}

export interface ExportAppealsQuery {
  status?: 'all' | 'pending' | 'reviewed' | 'rejected'
  type?: 'all' | 'Rate' | 'Novel' | 'Chapter'
  format?: 'csv' | 'json'
}
